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
    version: "0.8.26",
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
    },
  },
  zksolc: {
    version: "1.5.12",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      codegen: "yul",
    },
  },

  defaultNetwork: "hardhat",
  networks: {
    hardhat: {

    },
    lensTestnet: {
      url: 'https://rpc.testnet.lens.xyz',
      chainId: 37111,
      accounts: accounts,
      zksync: true,
      ethNetwork: "sepolia",
      verifyURL: 'https://api-explorer-verify.staging.lens.zksync.dev/contract_verification',
    },
    lensMainnet: {
      url: 'https://rpc.lens.xyz',
      chainId: 232,
      accounts: accounts,
      zksync: true,
      ethNetwork: "mainnet",
      verifyURL:
        "https://api-explorer-verify.lens.matterhosted.dev/contract_verification",
      
    },
    localhost: {

      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
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

  }
};

export default config;
