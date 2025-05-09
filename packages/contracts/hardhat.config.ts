import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Use require for path and dotenv for reliability within Hardhat config
const path = require("path");
const dotenv = require("dotenv");

const rootEnvPath = path.resolve(__dirname, '../../.env');
const dotenvResult = dotenv.config({ path: rootEnvPath });

if (dotenvResult.error) {
  console.warn(`[hardhat.config.ts] Warning: Error loading .env file from ${rootEnvPath}. Check if file exists and is valid.`, dotenvResult.error.message);
  console.warn("[hardhat.config.ts] Proceeding without .env file. Ensure environment variables are set if deploying to a live network.");
} else {
  console.log(`[hardhat.config.ts] Loaded .env file successfully from: ${rootEnvPath}`);
}

// Explicitly log the values being read for lensSepolia
const lensTestnetRpcUrlFromEnv = process.env.LENS_TESTNET_RPC_URL;
const lensTestnetPrivateKeyFromEnv = process.env.LENS_TESTNET_PRIVATE_KEY;

console.log("[hardhat.config.ts] LENS_TESTNET_RPC_URL from env:", lensTestnetRpcUrlFromEnv);
console.log("[hardhat.config.ts] LENS_TESTNET_PRIVATE_KEY from env:", lensTestnetPrivateKeyFromEnv ? "Found (length: " + lensTestnetPrivateKeyFromEnv.length + ")" : "NOT FOUND");

let lensSepoliaAccounts: string[] = [];
if (lensTestnetPrivateKeyFromEnv) {
  if ((lensTestnetPrivateKeyFromEnv.startsWith('0x') && lensTestnetPrivateKeyFromEnv.length === 66) || 
      (!lensTestnetPrivateKeyFromEnv.startsWith('0x') && lensTestnetPrivateKeyFromEnv.length === 64)) {
    lensSepoliaAccounts = [lensTestnetPrivateKeyFromEnv];
    console.log("[hardhat.config.ts] lensSepolia accounts array configured with 1 key.");
  } else {
    console.error("[hardhat.config.ts] ERROR: LENS_TESTNET_PRIVATE_KEY has invalid format/length.");
  }
} else {
  console.warn("[hardhat.config.ts] LENS_TESTNET_PRIVATE_KEY is not set. 'accounts' for lensSepolia will be empty.");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
         enabled: true,
         runs: 200,
      },
      // No remappings needed with correct imports and pnpm setup
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    lensSepolia: {
      url: lensTestnetRpcUrlFromEnv || "https://rpc.testnet.lens.dev",
      chainId: 37111,
      accounts: lensSepoliaAccounts,
    }
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test"
  },
  typechain: {
     outDir: 'typechain-types',
     target: 'ethers-v6',
  },
  etherscan: {
    apiKey: {
      "lensSepolia": process.env.LENS_TESTNET_BLOCKSCOUT_API_KEY || "YOUR_API_KEY_PLACEHOLDER"
    },
    customChains: [
      {
        network: "lensSepolia",
        chainId: 37111,
        urls: {
          apiURL: "https://explorer.testnet.lens.dev/api",
          browserURL: "https://explorer.testnet.lens.dev"
        }
      }
    ]
  }
};

export default config;
