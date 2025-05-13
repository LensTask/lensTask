#!/usr/bin/env node
/* Enhanced Hard-wired Lens Explorer verifier (zkSync Era) with verbose debug
 * ---------------------------------------------------------------
 * CONTRACT_ADDR    – address you want to verify
 * ARTIFACT_FQN     – fully-qualified contract name from artifacts/
 * CONSTRUCTOR_HEX  – hex-encoded constructor args WITHOUT leading 0x
 * ZK_SOLC_VERSION  – exact zksolc version used for deployment
 */

const hardhat = require("hardhat");
const { ethers } = hardhat;
const axios   = require("axios");
const fs      = require("fs");
const path    = require("path");

/* ─── EDIT THESE FOUR ONLY ─────────────────────────────────────── */
const CONTRACT_ADDR   = "0x4Cc176C98241ce651811B99b64dd95aEC6e44a05";
const ARTIFACT_FQN    = "contracts/BountyCollectModule.sol:BountyCollectModule";
const CONSTRUCTOR_HEX = "0x2c459684ef8C24A65C4632FE58b383C1Cf0c4cC6";
const ZK_SOLC_VERSION = "v1.5.12";
/* ──────────────────────────────────────────────────────────────── */

const DEBUG = true;           // set false for quiet mode
const POLL_INTERVAL_MS = 5_000;
const LOG_FILE = "./verification-debug.log";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Enhanced logging function that writes to both console and file
function log(message, obj = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;
  
  if (obj !== null) {
    if (typeof obj === 'object') {
      logMessage += `\n${JSON.stringify(obj, null, 2)}`;
    } else {
      logMessage += ` ${obj}`;
    }
  }
  
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + "\n");
}

function stripMetadata(hex) {
  if (hex.length < 4) return hex;
  const len = parseInt(hex.slice(-4), 16);
  const cut = (len + 2) * 2;
  log(`Metadata stripping: len=${len}, cut=${cut}`);
  return cut <= hex.length ? hex.slice(0, -cut) : hex;
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `=== Verification Debug Log - ${new Date().toISOString()} ===\n`);

(async () => {
  /* 0 ▸ show RPC info */
  const net = await ethers.provider.getNetwork();
  log("🔗 RPC URL:", hardhat.config.networks[hardhat.network.name].url);
  log("🔗 Network Name:", hardhat.network.name);
  log("🔗 chainId:", net.chainId.toString());

  /* 1 ▸ get on-chain code */
  log(`Fetching bytecode for contract at ${CONTRACT_ADDR}...`);
  const codeRaw = await ethers.provider.getCode(CONTRACT_ADDR);
  log("🔗 raw getCode length:", (codeRaw.length - 2) / 2, "bytes");
  log("🔗 raw bytecode (first 100 chars):", codeRaw.substring(0, 100) + "...");
  
  if (codeRaw === "0x") {
    log("❌ No byte-code at that address on this network.");
    process.exit(1);
  }
  
  const code = stripMetadata(codeRaw.toLowerCase());
  log("🔗 stripped runtime length:", code.length / 2, "bytes");
  log("🔗 stripped bytecode (first 100 chars):", code.substring(0, 100) + "...");

  /* 2 ▸ read local artifact and compare */
  log(`Reading artifact for ${ARTIFACT_FQN}...`);
  const art = await hardhat.artifacts.readArtifact(ARTIFACT_FQN);
  log("📦 Artifact found:", {
    contractName: art.contractName,
    sourceName: art.sourceName,
    abi: `[${art.abi.length} methods]`,
    bytecodeLength: (art.bytecode.length - 2) / 2,
    deployedBytecodeLength: (art.deployedBytecode.length - 2) / 2,
  });
  
  const local = stripMetadata(art.deployedBytecode.toLowerCase());
  log("📦 local artifact length:", local.length / 2, "bytes");
  log("📦 local bytecode (first 100 chars):", local.substring(0, 100) + "...");

  if (local !== code) {
    log("❌ Local build does NOT match on-chain runtime.");
    log("   Double-check compiler version / codegen / address.");
    
    // Additional debugging to help identify differences
    const minLength = Math.min(local.length, code.length);
    let firstDiffPos = -1;
    
    for (let i = 0; i < minLength; i++) {
      if (local[i] !== code[i]) {
        firstDiffPos = i;
        break;
      }
    }
    
    if (firstDiffPos >= 0) {
      const context = 20; // Show 20 chars before and after difference
      const start = Math.max(0, firstDiffPos - context);
      const end = Math.min(minLength, firstDiffPos + context);
      
      log(`First difference at position ${firstDiffPos}:`);
      log(`Local : ${local.substring(start, firstDiffPos)}[${local[firstDiffPos]}]${local.substring(firstDiffPos + 1, end)}`);
      log(`Remote: ${code.substring(start, firstDiffPos)}[${code[firstDiffPos]}]${code.substring(firstDiffPos + 1, end)}`);
    } else if (local.length !== code.length) {
      log(`Bytecodes have different lengths: local=${local.length}, onchain=${code.length}`);
    }
    
    process.exit(1);
  }
  log("✅ exact match – submitting source …");

  /* 3 ▸ prepare payload */
  log("Preparing payload for verification API...");
  const buildInfo = await hardhat.artifacts.getBuildInfo(ARTIFACT_FQN);
  const solcVer = buildInfo.solcVersion.split("+")[0];   // e.g. "0.8.23"
  
  log("Build Info:", {
    solcVersion: buildInfo.solcVersion,
    solcLongVersion: buildInfo._solcVersion,
    cleanedSolcVer: solcVer,
    compilationTarget: JSON.stringify(buildInfo.output.contracts[art.sourceName][art.contractName].metadata, null, 2)
  });

  // Log optimizer settings
  const optimizer = buildInfo.input.settings.optimizer || {};
  log("Optimizer settings:", optimizer);

  const payload = {
    module:               "contract",
    action:               "verifysourcecode",
    codeformat:           "solidity-standard-json-input",

    contractaddress:      CONTRACT_ADDR,
    contractname:         ARTIFACT_FQN,
    compilerversion:      solcVer,
    zkCompilerVersion:    ZK_SOLC_VERSION,
    
    // Add optimizationUsed and runs based on build info
    optimizationUsed:     optimizer.enabled ? "1" : "0",
    runs:                 optimizer.runs || 200,
    evmVersion:           buildInfo.input.settings.evmVersion || "paris",
    
    constructorArguements: CONSTRUCTOR_HEX,  // Etherscan typo kept on purpose
    sourceCode:           buildInfo.input
  };

  /* 4 ▸ POST to Lens Explorer */
  log("📤 Submit payload:");
  // Log a sanitized version of the payload (without full sourceCode for readability)
  const sanitizedPayload = {...payload};
  sanitizedPayload.sourceCode = "/* Source code omitted for log brevity */";
  log(sanitizedPayload);
  
  // Save full payload to file for inspection
  fs.writeFileSync("./verification-payload.json", JSON.stringify(payload, null, 2));
  log("Full payload saved to ./verification-payload.json");
  
  let start;
  try {
    log("Sending POST request to https://explorer-api.lens.xyz/api/contract/verifySourceCode...");
    const resp = await axios.post(
      "https://explorer-api.lens.xyz/api/contract/verifySourceCode",
      payload,
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 30000 // 30 second timeout
      }
    );
    start = resp.data;
    log("📥 Submit response:", start);
  } catch (err) {
    log("❌ HTTP error on submit:", err.response?.status, err.message);
    log("⤷ Response headers:", err.response?.headers);
    log("⤷ Response body:", err.response?.data);
    
    // If we have the raw request, log it too
    if (err.request) {
      log("⤷ Request details:", {
        method: err.request.method,
        path: err.request.path,
        host: err.request.host
      });
    }
    
    process.exit(1);
  }

  if (start.status !== "1") {
    log("❌ Lens Explorer error:", start.result);
    process.exit(1);
  }
  const guid = start.result;
  log("⚙️  verification queued – GUID:", guid);

  /* 5 ▸ poll until done */
  let attempts = 0;
  const pollUrl = `https://explorer-api.lens.xyz/api/contract/checkVerification?guid=${guid}`;
  while (true) {
    attempts++;
    log(`🔎 Poll #${attempts}: GET ${pollUrl}`);
    let poll;
    try {
      const resp = await axios.get(pollUrl, { timeout: 10000 }); // 10 second timeout
      poll = resp.data;
      log("📥 Poll response:", poll);
    } catch (e) {
      if (e.response?.status === 404) {
        log("… GUID not active yet (404), retrying in 5s");
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      log("❌ HTTP error on poll:", e.response?.status, e.message);
      log("⤷ Response headers:", e.response?.headers);
      log("⤷ Response body:", e.response?.data);
      process.exit(1);
    }

    if (poll.status === "0") {
      log("… still pending:", poll.result);
    } else if (poll.status === "1") {
      log("🎉  verified & published!");
      break;
    } else {
      log("❌ Verification failed:", poll.result);
      process.exit(1);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  log("🔗", `https://explorer.lens.xyz/address/${CONTRACT_ADDR}`);
  log("Verification process completed successfully!");
})().catch((err) => {
  log("❌ Unhandled error:", err.message ?? err);
  log(err.stack);
  process.exit(1);
});