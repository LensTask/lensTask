import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// No top-level import for dotenv here

// Load .env file from the root directory using require
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const privateKey = process.env.PRIVATE_KEY;

const accounts = privateKey && privateKey.length === 66 && privateKey.startsWith('0x')
                 ? [privateKey]
                 : (privateKey && privateKey.length === 64 && !privateKey.startsWith('0x')
                    ? ['0x' + privateKey]
                    : []);

const config: HardhatUserConfig = {
  solidity: "0.8.23",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    lensTestnet: {
      url: process.env.RPC_URL || "https://rpc.lens-chain-testnet.xyz",
      accounts: accounts,
    },
  },
  paths: { artifacts: "./artifacts" },
};

export default config;
