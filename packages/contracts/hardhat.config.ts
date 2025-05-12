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
      // Remappings section entirely removed
      optimizer: {
        enabled: true,
        runs: 200,
      },
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
