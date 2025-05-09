import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
// Import contract type from TypeChain using the paths defined in your hardhat config
import { BountyCollectModule } from "../typechain-types/contracts/BountyCollectModule";
import { AcceptedAnswerNFT } from "../typechain-types/contracts/AcceptedAnswerNFT"; // Import NFT type
import { MockERC20 } from "../typechain-types/contracts/MockERC20"; // Correct path for MockERC20

describe("BountyCollectModule", () => {
  let deployer: Signer;
  let asker: Signer;
  let expert: Signer; // Add expert signer
  let other: Signer;
  let bountyModule: BountyCollectModule;
  let answerNFT: AcceptedAnswerNFT; // Add NFT instance
  let mockERC20: MockERC20;
  const bountyAmount = ethers.parseUnits("100", 18);
  const actionId = ethers.encodeBytes32String("test-action-1");

  // Helper to initialize a bounty for tests
  async function initializeBounty() {
      const askerAddress = await asker.getAddress();
      const tokenAddress = await mockERC20.getAddress();
      const initData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [tokenAddress, bountyAmount]
      );
      // Asker needs to approve before initialize
      await mockERC20.connect(asker).approve(await bountyModule.getAddress(), bountyAmount);
      // Initialize (caller doesn't matter much here, using deployer)
      await bountyModule.connect(deployer).initialize(actionId, askerAddress, initData);
  }


  beforeEach(async () => {
    [deployer, asker, expert, other] = await ethers.getSigners(); // Add expert

    // Deploy NFT
    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployer);
    answerNFT = await NFTFactory.deploy(await deployer.getAddress()); // Deployer is initial owner
    await answerNFT.waitForDeployment();
    const nftAddress = await answerNFT.getAddress();

    // Deploy BountyCollectModule, passing NFT address
    const BountyCollectModuleFactory = await ethers.getContractFactory("BountyCollectModule", deployer);
    bountyModule = await BountyCollectModuleFactory.deploy(nftAddress);
    await bountyModule.waitForDeployment();
    const moduleAddress = await bountyModule.getAddress();

    // Set the module address in the NFT contract
    await answerNFT.connect(deployer).setModule(moduleAddress);

    // Deploy Mock ERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20", deployer);
    mockERC20 = await MockERC20Factory.deploy("MockToken", "MOCK", 18);
    await mockERC20.waitForDeployment();
    // Mint only to asker initially
    await mockERC20.mint(await asker.getAddress(), bountyAmount);
  });

  describe("Deployment", () => {
     it("Should deploy successfully", async () => {
       expect(await bountyModule.getAddress()).to.not.equal(ethers.ZeroAddress);
       expect(await bountyModule.getAddress()).to.be.properAddress;
     });

     it("Should set the right owner", async () => {
        expect(await bountyModule.owner()).to.equal(await deployer.getAddress());
     });
     it("Should have the NFT address set", async () => {
       expect(await bountyModule.acceptedAnswerNFT()).to.equal(await answerNFT.getAddress());
     });
     it("NFT should have the module address set", async () => {
       expect(await answerNFT.module()).to.equal(await bountyModule.getAddress());
     });
  });

  describe("initialize", () => {
    it("Should initialize bounty, store data, and escrow funds", async () => {
        const askerAddress = await asker.getAddress();
        const tokenAddress = await mockERC20.getAddress();
        const moduleAddress = await bountyModule.getAddress();

        // Approve needs to happen before initialize
        await mockERC20.connect(asker).approve(await bountyModule.getAddress(), bountyAmount);

        const initData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "uint256"],
            [tokenAddress, bountyAmount]
        );
        const tx = await bountyModule.connect(deployer).initialize(actionId, askerAddress, initData);

        const storedBounty = await bountyModule.bountyStore(actionId);
        expect(storedBounty.isInitialized).to.be.true;
        expect(storedBounty.bountyCurrency).to.equal(tokenAddress);
        expect(storedBounty.bountyAmount).to.equal(bountyAmount);
        expect(storedBounty.asker).to.equal(askerAddress);
        expect(storedBounty.selectedExpert).to.equal(ethers.ZeroAddress);
        await expect(tx).to.emit(bountyModule, "BountyInitialized").withArgs(actionId, tokenAddress, bountyAmount, askerAddress);
        expect(await mockERC20.balanceOf(askerAddress)).to.equal(0); // Asker starts with 100, pays 100
        expect(await mockERC20.balanceOf(moduleAddress)).to.equal(bountyAmount);
    });

    it("Should fail if already initialized", async () => {
        const askerAddress = await asker.getAddress();
        const tokenAddress = await mockERC20.getAddress();
        const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, bountyAmount]);
        await initializeBounty(); // Use helper to initialize first

        await expect(
            bountyModule.connect(deployer).initialize(actionId, askerAddress, initData)
        ).to.be.revertedWith("Bounty: Already initialized");
     });

    it("Should fail with zero amount", async () => {
        const askerAddress = await asker.getAddress();
        const tokenAddress = await mockERC20.getAddress();
        const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, 0]);

        await expect(
            bountyModule.connect(deployer).initialize(actionId, askerAddress, initData)
        ).to.be.revertedWith("Bounty: Amount must be positive");
      });

     it("Should fail with invalid asker address", async () => {
        const tokenAddress = await mockERC20.getAddress();
         const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, bountyAmount]);

         await expect(
             bountyModule.connect(deployer).initialize(actionId, ethers.ZeroAddress, initData)
         ).to.be.revertedWith("Bounty: Invalid asker address");
     });

      it("Should fail if transferFrom fails (insufficient approval)", async () => {
         const askerAddress = await asker.getAddress();
         const tokenAddress = await mockERC20.getAddress();
         const moduleAddress = await bountyModule.getAddress();
         const insufficientAmount = bountyAmount / BigInt(2);

         // Approve for less than the bounty amount
         await mockERC20.connect(asker).approve(moduleAddress, insufficientAmount);

         const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, bountyAmount]);

         // Expect the standard ERC20 error for insufficient allowance from OpenZeppelin v5
         await expect(
             bountyModule.connect(deployer).initialize(actionId, askerAddress, initData)
         ).to.be.revertedWithCustomError(mockERC20, "ERC20InsufficientAllowance");
     });
  });

  // --- NEW: processAction Tests ---
  describe("processAction", () => {
     beforeEach(async () => {
        // Initialize a bounty before each processAction test
        await initializeBounty();
     });

     it("Should pay the bounty, mint NFT to the expert, and emit event", async () => {
         const askerAddress = await asker.getAddress();
         const expertAddress = await expert.getAddress();
         const moduleAddress = await bountyModule.getAddress();

         // Encode expert address for processData
         const processData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]);

         // Ensure balances before
         expect(await mockERC20.balanceOf(moduleAddress)).to.equal(bountyAmount);
         expect(await mockERC20.balanceOf(expertAddress)).to.equal(0);
         expect(await answerNFT.balanceOf(expertAddress)).to.equal(0); // Expert has 0 NFTs initially

         // Call processAction as the asker
         const tx = await bountyModule.connect(asker).processAction(actionId, askerAddress, processData);

         // Check events
         await expect(tx).to.emit(bountyModule, "BountyPaid").withArgs(actionId, expertAddress, bountyAmount);
         // Check NFT Transfer event (emitted by ERC721 _mint) for tokenId 0
         await expect(tx).to.emit(answerNFT, "Transfer").withArgs(ethers.ZeroAddress, expertAddress, 0);

         // Check final balances
         expect(await mockERC20.balanceOf(moduleAddress)).to.equal(0); // Module paid out
         expect(await mockERC20.balanceOf(expertAddress)).to.equal(bountyAmount); // Expert received
         expect(await answerNFT.balanceOf(expertAddress)).to.equal(1); // Expert should have 1 NFT
         expect(await answerNFT.ownerOf(0)).to.equal(expertAddress); // Verify owner of tokenId 0

         // Check paid status and stored expert
         expect(await bountyModule.paid(actionId)).to.be.true;
         const storedBounty = await bountyModule.bountyStore(actionId);
         expect(storedBounty.selectedExpert).to.equal(expertAddress);
     });

     it("Should fail if called by non-asker", async () => {
        const otherAddress = await other.getAddress();
        const expertAddress = await expert.getAddress();
        const processData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]);

        await expect(
            bountyModule.connect(other).processAction(actionId, otherAddress, processData) // Called by 'other'
        ).to.be.revertedWith("Bounty: Only asker can accept");
     });

     it("Should fail if bounty is already paid", async () => {
        const askerAddress = await asker.getAddress();
        const expertAddress = await expert.getAddress();
        const processData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]);

        // Pay once
        await bountyModule.connect(asker).processAction(actionId, askerAddress, processData);

        // Try to pay again
        await expect(
            bountyModule.connect(asker).processAction(actionId, askerAddress, processData)
        ).to.be.revertedWith("Bounty: Already paid");
     });

      it("Should fail if bounty is not initialized", async () => {
         const askerAddress = await asker.getAddress();
         const expertAddress = await expert.getAddress();
         const uninitializedActionId = ethers.encodeBytes32String("uninitialized");
         const processData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]);

         await expect(
             bountyModule.connect(asker).processAction(uninitializedActionId, askerAddress, processData)
         ).to.be.revertedWith("Bounty: Not initialized");
      });

      it("Should fail with invalid expert address", async () => {
         const askerAddress = await asker.getAddress();
         const processData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ethers.ZeroAddress]); // Zero address

         await expect(
             bountyModule.connect(asker).processAction(actionId, askerAddress, processData)
         ).to.be.revertedWith("Bounty: Invalid expert address");
      });
  });
});
