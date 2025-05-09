import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy AcceptedAnswerNFT
  console.log("Deploying AcceptedAnswerNFT...");
  const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT");
  // Pass deployer address as initial owner for Ownable
  const answerNFT = await NFTFactory.deploy(deployer.address);
  await answerNFT.waitForDeployment();
  const nftAddress = await answerNFT.getAddress();
  console.log("AcceptedAnswerNFT deployed to:", nftAddress);

  // 2. Deploy BountyCollectModule, passing the NFT address to its constructor
  console.log("Deploying BountyCollectModule...");
  const ModuleFactory = await ethers.getContractFactory("BountyCollectModule");
  const bountyModule = await ModuleFactory.deploy(nftAddress); // Pass NFT address
  await bountyModule.waitForDeployment();
  const moduleAddress = await bountyModule.getAddress();
  console.log("BountyCollectModule deployed to:", moduleAddress);

  // 3. Set the module address in the NFT contract (so module can mint)
  console.log(`Setting module address (${moduleAddress}) in NFT contract...`);
  const tx = await answerNFT.connect(deployer).setModule(moduleAddress);
  await tx.wait(); // Wait for transaction confirmation
  console.log("Module address set successfully in NFT contract.");
  const storedModule = await answerNFT.module();
  if (storedModule.toLowerCase() === moduleAddress.toLowerCase()) {
     console.log("Verification PASSED: NFT contract 'module' address matches deployed module.");
  } else {
     console.error("Verification FAILED: NFT contract 'module' address mismatch!");
     console.error(" Stored:", storedModule);
     console.error(" Expected:", moduleAddress);
  }


  console.log("\n--- Deployment Summary ---");
  console.log("BountyCollectModule:", moduleAddress);
  console.log("AcceptedAnswerNFT:", nftAddress);
  console.log("--------------------------");
}

main().catch((e) => {
  console.error("Deployment failed:", e);
  process.exit(1);
});
