import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import { BountyCollectModule } from "../typechain-types/contracts/BountyCollectModule";
import { AcceptedAnswerNFT } from "../typechain-types/contracts/AcceptedAnswerNFT";

describe("BountyCollectModule (Lens Testnet Deployment)", function () {
  this.timeout(240000); // Increase timeout for real testnet interactions (4 minutes)

  let deployer: Signer;
  let deployerAddress: string;
  let hubPlaceholderAddress: string;

  before(async function () {
    console.log("[Testnet Test] Running 'before all' hook...");
    console.log("[Testnet Test] Current network selected:", network.name);

    if (network.name !== "lensSepolia") {
      console.log(`[Testnet Test] Not on lensSepolia network (current: ${network.name}), skipping actual deployment tests.`);
      this.skip();
      return; // Ensure no further execution in before hook if skipping
    }

    console.log("[Testnet Test] Attempting to get signers...");
    const signers = await ethers.getSigners();
    if (!signers || signers.length === 0) {
        console.error("[Testnet Test] ERROR: No signers returned from ethers.getSigners(). Check Hardhat network config and private key.");
        throw new Error("No signers available for deployment on lensSepolia.");
    }
    deployer = signers[0];
    console.log("[Testnet Test] Deployer signer object:", deployer);

    if (!deployer) {
        console.error("[Testnet Test] ERROR: Deployer signer is undefined even after ethers.getSigners().");
        throw new Error("Deployer signer undefined.");
    }

    try {
        deployerAddress = await deployer.getAddress();
    } catch (e) {
        console.error("[Testnet Test] ERROR: Failed to getAddress from deployer signer:", e);
        throw e;
    }
    
    hubPlaceholderAddress = deployerAddress; // Using deployer as placeholder for Hub in constructor

    console.log("[Testnet Test] Using deployer account:", deployerAddress);
    const balance = await ethers.provider.getBalance(deployerAddress);
    console.log("[Testnet Test] Account balance:", ethers.formatUnits(balance, 18), "GRASS");
    if (balance < ethers.parseUnits("0.0005", 18)) {
        console.warn("[Testnet Test] WARNING: Deployer account has very low GRASS balance. Deployment might fail.");
    }
    console.log("[Testnet Test] 'before all' hook completed.");
  });

  it("Should deploy AcceptedAnswerNFT to Lens Testnet", async function () {
    console.log("[Testnet Test - NFT] Deploying AcceptedAnswerNFT to Lens Testnet...");
    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployer);
    const answerNFT = await NFTFactory.deploy(deployerAddress);
    await answerNFT.waitForDeployment();
    const nftAddress = await answerNFT.getAddress();
    console.log("[Testnet Test - NFT] AcceptedAnswerNFT deployed to Lens Testnet at:", nftAddress);
    console.log("[Testnet Test - NFT] Transaction hash:", answerNFT.deploymentTransaction()?.hash);
    expect(nftAddress).to.be.properAddress;
  });

  it("Should deploy BountyCollectModule to Lens Testnet", async function () {
    // Re-deploy NFT for this test's scope
    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployer);
    const localAnswerNFT = await NFTFactory.deploy(deployerAddress);
    await localAnswerNFT.waitForDeployment();
    const localNftAddress = await localAnswerNFT.getAddress();

    console.log("[Testnet Test - Module] Deploying BountyCollectModule to Lens Testnet...");
    const ModuleFactory = await ethers.getContractFactory("BountyCollectModule", deployer);
    const bountyModule = await ModuleFactory.deploy(localNftAddress, hubPlaceholderAddress);
    await bountyModule.waitForDeployment();
    const moduleAddress = await bountyModule.getAddress();
    console.log("[Testnet Test - Module] BountyCollectModule deployed to Lens Testnet at:", moduleAddress);
    console.log("[Testnet Test - Module] Transaction hash:", bountyModule.deploymentTransaction()?.hash);
    expect(moduleAddress).to.be.properAddress;
  });

  it("Should allow setting module in AcceptedAnswerNFT on Lens Testnet", async function () {
    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployer);
    const testNft = await NFTFactory.deploy(deployerAddress);
    await testNft.waitForDeployment();
    const testNftAddress = await testNft.getAddress();

    const ModuleFactory = await ethers.getContractFactory("BountyCollectModule", deployer);
    const testModule = await ModuleFactory.deploy(testNftAddress, hubPlaceholderAddress);
    await testModule.waitForDeployment();
    const testModuleAddress = await testModule.getAddress();

    console.log(`[Testnet Test - SetModule] Setting module for NFT (${testNftAddress}) to ${testModuleAddress} on Lens Testnet...`);
    const tx = await testNft.connect(deployer).setModule(testModuleAddress);
    console.log("[Testnet Test - SetModule] setModule tx hash:", tx.hash);
    await tx.wait(1);
    console.log("[Testnet Test - SetModule] setModule transaction confirmed.");
    expect(await testNft.module()).to.equal(testModuleAddress);
  });
});
