import { ethers } from "hardhat";

async function main() {
  console.log("Deploying simplified AcceptedAnswerNFT...");
  const AnswerNFT = await ethers.deployContract("AcceptedAnswerNFT", [ethers.ZeroAddress]); // Constructor now takes an address
  await AnswerNFT.waitForDeployment();
  console.log("AcceptedAnswerNFT deployed to:", await AnswerNFT.getAddress());

  console.log("Deploying simplified BountyCollectModule...");
  const Module = await ethers.deployContract("BountyCollectModule"); // Constructor now takes no arguments
  await Module.waitForDeployment();
  console.log("BountyCollectModule deployed to:", await Module.getAddress());

  // No transferOwnership call as it's removed from the skeleton
  // await AnswerNFT.writeContractMethod("transferOwnership", Module.getAddress());

  console.log("Simplified contracts deployed (skeleton versions).");
  console.log("Module address:", await Module.getAddress());
  console.log("AnswerNFT address:", await AnswerNFT.getAddress());
}

main().catch((e) => {
  console.error("Deployment failed:", e);
  process.exit(1);
});
