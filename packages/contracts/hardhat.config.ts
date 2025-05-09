import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

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
      // Remappings section entirely removed
      optimizer: {
         enabled: true,
         runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    lensTestnet: {
      url: process.env.RPC_URL || "",
      accounts: accounts,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
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
};

export default config;
