#!/usr/bin/env node
/* Hard-wired Lens Explorer verifier (zkSync Era)
 * ---------------------------------------------------------------
 * CONTRACT_ADDR    – address you want to verify
 * ARTIFACT_FQN     – fully-qualified contract name from artifacts/
 * CONSTRUCTOR_HEX  – hex-encoded constructor args WITHOUT leading 0x
 * ZK_SOLC_VERSION  – exact zksolc version used for deployment
 */

const hardhat = require("hardhat");
const { ethers } = hardhat;
const axios   = require("axios");

/* ─── EDIT THESE FOUR ONLY ─────────────────────────────────────── */
const CONTRACT_ADDR   = "0x9d5bFFc260B4F588b634984dbdd690f0D460957f";
const ARTIFACT_FQN    = "contracts/BountyCollectModule.sol:BountyCollectModule";
const CONSTRUCTOR_HEX = "F33e4D0D5c334dfFb8C776637CD2473F08ad9cA1";
const ZK_SOLC_VERSION = "v1.5.12";
/* ──────────────────────────────────────────────────────────────── */

const DEBUG = true;           // set false for quiet mode
const POLL_INTERVAL_MS = 5_000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function stripMetadata(hex) {
  if (hex.length < 4) return hex;
  const len = parseInt(hex.slice(-4), 16);
  const cut = (len + 2) * 2;
  return cut <= hex.length ? hex.slice(0, -cut) : hex;
}

(async () => {
  /* 0 ▸ show RPC info */
  const net = await ethers.provider.getNetwork();
  console.log("🔗 RPC URL :", hardhat.config.networks[hardhat.network.name].url);
  console.log("🔗 chainId :", net.chainId.toString());

  /* 1 ▸ get on-chain code */
  const codeRaw = await ethers.provider.getCode(CONTRACT_ADDR);
  console.log("🔗 raw getCode length :", (codeRaw.length - 2) / 2, "bytes");
  if (codeRaw === "0x") {
    console.error("❌ No byte-code at that address on this network.");
    process.exit(1);
  }
  const code = stripMetadata(codeRaw.toLowerCase());
  console.log("🔗 stripped runtime length :", code.length / 2, "bytes");

  /* 2 ▸ read local artifact and compare */
  const art   = await hardhat.artifacts.readArtifact(ARTIFACT_FQN);
  const local = stripMetadata(art.deployedBytecode.toLowerCase());
  console.log("📦 local artifact length   :", local.length / 2, "bytes");

  if (local !== code) {
    console.error("❌ Local build does NOT match on-chain runtime.");
    console.error("   Double-check compiler version / codegen / address.");
    process.exit(1);
  }
  console.log("✅ exact match – submitting source …");

  /* 3 ▸ prepare payload */
  const buildInfo = await hardhat.artifacts.getBuildInfo(ARTIFACT_FQN);
  const solcVer   = buildInfo.solcVersion.split("+")[0];   // e.g. "0.8.23"

  const payload = {
    module:               "contract",
    action:               "verifysourcecode",
    codeformat:           "solidity-standard-json-input",

    contractaddress:      CONTRACT_ADDR,
    contractname:         ARTIFACT_FQN,
    compilerversion:      solcVer,
    zkCompilerVersion:    ZK_SOLC_VERSION,

    constructorArguements: CONSTRUCTOR_HEX,  // Etherscan typo kept on purpose
    sourceCode:           buildInfo.input
  };

  /* 4 ▸ POST to Lens Explorer */
  const { data: start } = await axios.post(
    "https://explorer-api.lens.xyz/api/contract/verifySourceCode",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  if (start.status !== "1") {
    console.error("❌ Lens Explorer error:", start.result);
    process.exit(1);
  }
  const guid = start.result;
  console.log("⚙️  verification queued – GUID:", guid);

  /* 5 ▸ poll until done */
  while (true) {
    try {
      const { data: poll } = await axios.get(
        `https://explorer-api.lens.xyz/api/contract/checkVerification?guid=${guid}`
      );

      if (poll.status === "0") {
        if (DEBUG) console.log("…", poll.result);
      } else if (poll.status === "1") {
        console.log("🎉  verified & published!");
        break;
      } else {
        console.error("❌ Verification failed:", poll.result);
        process.exit(1);
      }
    } catch (e) {
      /* Treat the very first 404 as “GUID not ready yet” */
      if (e.response?.status === 404) {
        if (DEBUG) console.log("… GUID not active yet (404) – retrying");
      } else {
        throw e;
      }
    }
    await sleep(POLL_INTERVAL_MS);
  }

  console.log("🔗", `https://explorer.lens.xyz/address/${CONTRACT_ADDR}`);
})().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});
