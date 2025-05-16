import { Provider, Wallet } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import "dotenv/config";
import { ethers } from "ethers";

import "@matterlabs/hardhat-zksync-node/dist/type-extensions";
import "@matterlabs/hardhat-zksync-verify/dist/src/type-extensions";

import { HardhatRuntimeEnvironment } from "hardhat/types";

type DeployContractOptions = {
  /**
   * If true, the deployment process will not print any logs
   *
   * @default false
   */
  silent?: boolean;
  /**
   * If true, the contract will be verified on Block Explorer,
   * provided that the network has a verification URL.
   *
   * @default false
   */
  verify?: boolean;
  /**
   * If specified, the contract will be deployed using this wallet
   *
   * @default Wallet instance from PRIVATE_KEY env variable
   */
  wallet?: Wallet;
  /**
   * If specified, the contract will be deployed using this Hardhat Runtime Environment
   *
   * @default `hre` global variable
   */
  hre?: HardhatRuntimeEnvironment;
};

type RequiredDeployContractOptions = Required<DeployContractOptions>;

// ActionHub contract address for chain ID
const ACTION_HUB_ADDRESS: Record<number, string> = {
    232: "0xc6d57ee750ef2ee017a9e985a0c4198bed16a802", // mainnet
    37111: "0x4A92a97Ff3a3604410945ae8CA25df4fBB2fDC11" // testnet
};

export const getProvider = () => {
  const rpcUrl = hre.network.config.url;
  if (!rpcUrl)
    throw `⛔️ RPC URL wasn't found in "${hre.network.name}"! Please add a "url" field to the network config in hardhat.config.ts`;

  // Initialize zkSync Provider
  const provider = new Provider(rpcUrl);

  return provider;
};

export const getWallet = (privateKey?: string) => {
  if (!privateKey) {
    // Get wallet private key from .env file
    if (!process.env.PRIVATE_KEY)
      throw "⛔️ Wallet private key wasn't found in .env file!";
  }

  const provider = getProvider();

  // Initialize zkSync Wallet
  const wallet = new Wallet(privateKey ?? process.env.PRIVATE_KEY!, provider);

  return wallet;
};

export const verifyEnoughBalance = async (wallet: Wallet, amount: bigint) => {
  // Check if the wallet has enough balance
  const balance = await wallet.getBalance();
  if (balance < amount)
    throw `⛔️ Wallet balance is too low! Required ${ethers.formatEther(
      amount
    )} ETH, but current ${wallet.address} balance is ${ethers.formatEther(
      balance
    )} ETH`;
};

/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
export const verifyContract = async (data: {
  address: string;
  contract: string;
  constructorArguments: string;
  bytecode: string;
}) => {
  const verificationRequestId: number = await hre.run("verify:verify", {
    ...data,
    noCompile: true,
  });
  return verificationRequestId;
};

const createDeploymentLogger = (options: RequiredDeployContractOptions) => {
  return (message: string) => {
    if (options.silent) {
      return;
    }
    console.log(message);
  };
};

type Logger = ReturnType<typeof createDeploymentLogger>;

const resolveWallet = (options: RequiredDeployContractOptions) => {
  return options?.wallet ?? getWallet();
};

const loadArtifact = async (
  deployer: Deployer,
  contractArtifactName: string
) => {
  return await deployer.loadArtifact(contractArtifactName).catch((error) => {
    if (
      error?.message?.includes(
        `Artifact for contract "${contractArtifactName}" not found.`
      )
    ) {
      console.error(error.message);
      throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
    } else {
      throw error;
    }
  });
};

function defaultOptions(
  options?: DeployContractOptions
): RequiredDeployContractOptions {
  return {
    silent: false,
    verify: false,
    wallet: getWallet(),
    hre: hre,
    ...options,
  };
}

export const deployContract = async (
  contractArtifactName: string,
  constructorArguments: any[],
  opts?: DeployContractOptions
) => {
  const options = defaultOptions(opts);
  const log = createDeploymentLogger(options);

  log(`\nStarting deployment process of "${contractArtifactName}"...`);

  const wallet = resolveWallet(options);
  const deployer = new Deployer(hre, wallet);
  const artifact = await loadArtifact(deployer, contractArtifactName);

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(
    artifact,
    constructorArguments
  );
  log(`Estimated deployment cost: ${ethers.formatEther(deploymentFee)} ETH`);

  // Check if the wallet has enough balance
  await verifyEnoughBalance(wallet, deploymentFee);

  // Deploy the contract to zkSync
  const contract = await deployer.deploy(artifact, constructorArguments);
  const address = await contract.getAddress();
  const constructorArgs = contract.interface.encodeDeploy(constructorArguments);
  const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;

  // Display contract deployment info
  log(`\n"${artifact.contractName}" was successfully deployed:`);
  log(` - Contract address: ${address}`);
  log(` - Contract source: ${fullContractSource}`);
  log(` - Encoded constructor arguments: ${constructorArgs}\n`);

  if (options.verify && hre.network.config.verifyURL) {
    log(`Requesting contract verification...`);
    await verifyContract({
      address,
      contract: fullContractSource,
      constructorArguments: constructorArgs,
      bytecode: artifact.bytecode,
    });
  }

  return contract;
};

export const getActionHubAddress = function(chainId?: number) {
  if (!chainId) {
    throw new Error("Chain ID must be set in hardhat config!");
  }
  if (!Object.keys(ACTION_HUB_ADDRESS).includes(chainId.toString())) {
    throw new Error(`No ActionHub address available for chain ID ${chainId}`);
  }

  return ACTION_HUB_ADDRESS[chainId];
}
