import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("Target network:", network.name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());

  console.log("Deploying AcceptedAnswerNFT...");
  const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT");
  const answerNFT = await NFTFactory.deploy(deployer.address);
  await answerNFT.waitForDeployment();
  const nftAddress = await answerNFT.getAddress();
  console.log("AcceptedAnswerNFT deployed to:", nftAddress);
  console.log(" - Transaction hash:", answerNFT.deploymentTransaction()?.hash);

  console.log("Deploying BountyCollectModule...");
  const ModuleFactory = await ethers.getContractFactory("BountyCollectModule");
  // Constructor for BountyCollectModule no longer takes Hub address for V3
  const bountyModule = await ModuleFactory.deploy(nftAddress);
  await bountyModule.waitForDeployment();
  const moduleAddress = await bountyModule.getAddress();
  console.log("BountyCollectModule deployed to:", moduleAddress);
  console.log(" - Transaction hash:", bountyModule.deploymentTransaction()?.hash);

  console.log(`Setting module address (${moduleAddress}) in NFT contract (${nftAddress})...`);
  const tx = await answerNFT.connect(deployer).setModule(moduleAddress);
  console.log(" - setModule transaction hash:", tx.hash);
  await tx.wait(1);
  console.log("Module address set successfully in NFT contract.");

  console.log("\n--- Deployment Summary (Network: ${network.name}) ---");
  console.log("BountyCollectModule Address:", moduleAddress);
  console.log("AcceptedAnswerNFT Address  :", nftAddress);
  console.log("Deployer Address         :", deployer.address);
  console.log("---------------------------------------------------");

  if (network.name === "lensSepolia") {
    console.log("\nTo verify contracts on Lens Sepolia Testnet Explorer (https://explorer.testnet.lens.dev):");
    console.log(`AcceptedAnswerNFT (${nftAddress}): ${deployer.address}`);
    console.log(`BountyCollectModule (${moduleAddress}): "${nftAddress}"`);
  }
}

main().catch((e) => {
  console.error("Deployment failed:", e);
  process.exit(1);
});