#!/usr/bin/env node
/*───────────────────────────────────────────────────────────────────────────────
  Production Lens-Explorer verifier (zkSync Era) — verbose & robust
───────────────────────────────────────────────────────────────────────────────
  • CONTRACT_ADDR  – address you want to verify
  • ARTIFACT_FQN   – fully-qualified contract name inside artifacts/
  • CONSTRUCTOR_HEX-BYTES (no 0x !)  – constructor calldata you passed at deploy
  • ZK_SOLC_VER    – exact zksolc version used
───────────────────────────────────────────────────────────────────────────────*/

const hardhat = require("hardhat");
const { ethers } = hardhat;
const axios     = require("axios");
const fs        = require("fs");

//─── EDIT THESE FOUR ONLY ──────────────────────────────────────────────────────
const CONTRACT_ADDR   = "0xf30AA8d81C5DAc64A93ed0BCFC89a0404ca18790";
const ARTIFACT_FQN    = "contracts/BountyCollectModule.sol:BountyCollectModule";
const CONSTRUCTOR_HEX = "000000000000000000000000e34bac9a4b4d308f79c1b3a7036149dd717fea1a";   // 🚫 no 0x !
const ZK_SOLC_VER     = "v1.5.12";
//───────────────────────────────────────────────────────────────────────────────

const POLL_MS  = 5_000;
const LOG_FILE = "./verify.log";

/* ── helpers ─────────────────────────────────────────────────────────────────*/
const log = (...msg) => {
  const line = `[${new Date().toISOString()}] ${msg.join(" ")}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const stripMetadata = hex => {
  if (hex.length < 4) return hex;
  const len = parseInt(hex.slice(-4), 16);
  const cut = (len + 2) * 2;
  return cut <= hex.length ? hex.slice(0, -cut) : hex;
};

/* ── main ────────────────────────────────────────────────────────────────────*/
fs.writeFileSync(LOG_FILE, `=== Lens verify ${new Date().toISOString()} ===\n`);

(async () => {
  /* 1 ▸ chain info */
  const net  = await ethers.provider.getNetwork();
  const conf = hardhat.config.networks[hardhat.network.name];
  log("RPC :", conf.url);
  log("Chain:", net.chainId);

  /* 2 ▸ compare byte-code */
  const runtimeOnChain = stripMetadata(
    (await ethers.provider.getCode(CONTRACT_ADDR)).toLowerCase()
  );
  if (runtimeOnChain === "0x") throw new Error("no code on-chain");

  const art  = await hardhat.artifacts.readArtifact(ARTIFACT_FQN);
  const runtimeLocal = stripMetadata(art.deployedBytecode.toLowerCase());

  if (runtimeOnChain !== runtimeLocal)
    throw new Error("local build does NOT match on-chain runtime");

  /* 3 ▸ prepare payload */
  const build   = await hardhat.artifacts.getBuildInfo(ARTIFACT_FQN);
  const solcVer = build.solcVersion.split("+")[0];
  const opt     = build.input.settings.optimizer || {};

  const payload = {
    module:              "contract",
    action:              "verifysourcecode",
    codeformat:          "solidity-standard-json-input",

    contractaddress:     CONTRACT_ADDR,
    contractname:        ARTIFACT_FQN,
    compilerversion:     solcVer,
    zkCompilerVersion:   ZK_SOLC_VER,

    optimizationUsed:    opt.enabled ? "1" : "0",
    runs:                opt.runs || 200,
    evmVersion:          build.input.settings.evmVersion || "paris",

    constructorArguements: CONSTRUCTOR_HEX.startsWith("0x")
                           ? CONSTRUCTOR_HEX.slice(2)
                           : CONSTRUCTOR_HEX,

    sourceCode:           build.input
  };

  /* 4 ▸ submit */
  const { data: start } = await axios.post(
    "https://explorer-api.lens.xyz/api/contract/verifySourceCode",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  if (start.status !== "1")
    throw new Error(`explorer error: ${start.result}`);

  const guid = start.result;
  log("GUID:", guid);

  /* 5 ▸ poll */
  const pollURL =
    `https://explorer-api.lens.xyz/api?module=contract&action=checkverifystatus&guid=${guid}`;

  for (;;) {
    await sleep(POLL_MS);
    const { data: poll } = await axios.get(pollURL);
    if (poll.result === "Pass - Verified") {
      log("✅ verified!");
      break;
    }
    if (poll.status === "0") {
      log("…", poll.result);
    } else {
      throw new Error(`verification failed: ${poll.result}`);
    }
  }

  log("Link: https://explorer.lens.xyz/address/" + CONTRACT_ADDR);
})().catch(e => {
  log("❌", e.message);
  process.exit(1);
});
