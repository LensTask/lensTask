import { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";
import "@matterlabs/hardhat-zksync";

const privateKey = process.env.PRIVATE_KEY;

const accounts = privateKey && privateKey.length === 66 && privateKey.startsWith('0x')
  ? [privateKey]
  : (privateKey && privateKey.length === 64 && !privateKey.startsWith('0x')
    ? ['0x' + privateKey]
    : []);

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
  zksolc: {
    version: "latest",
    settings: {},
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
   
    },
    lensTestnet: {
      url: 'https://rpc.testnet.lens.xyz', //process.env.RPC_URL || "",
      accounts: accounts,
      zksync: true,
      ethNetwork: "sepolia",
    },
    lensMainnet: {
      url: 'https://rpc.lens.xyz',
      accounts: accounts,
      zksync: true,
      ethNetwork: "mainnet",
    },
    localhost: {

      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // lensSepolia: {
    //   url: lensTestnetRpcUrlFromEnv || "https://rpc.testnet.lens.dev",
    //   chainId: 37111,
    //   accounts: lensSepoliaAccounts,
    // }
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
