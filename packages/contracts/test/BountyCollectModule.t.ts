import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { BountyCollectModule } from "../typechain-types/contracts/BountyCollectModule";
import { AcceptedAnswerNFT } from "../typechain-types/contracts/AcceptedAnswerNFT";
import { MockERC20 } from "../typechain-types/contracts/MockERC20";
// Import the Types struct. Ensure this path is correct relative to the test file
// or that remappings allow "lens-modules/..." to be found.
// If using remappings: import { Types } from "lens-modules/contracts/libraries/constants/Types.sol";
// For direct relative path based on typical node_modules structure:
import { Types } from "../node_modules/lens-modules/contracts/libraries/constants/Types";


describe("BountyCollectModule", () => {
  let deployer: Signer; // Will also act as the mock Hub
  let asker: Signer;
  let expert: Signer;
  let other: Signer;
  let bountyModule: BountyCollectModule;
  let answerNFT: AcceptedAnswerNFT;
  let mockERC20: MockERC20;

  let deployerAddress: string;
  let askerAddress: string;
  let expertAddress: string;
  let otherAddress: string;
  let nftAddress: string;
  let moduleAddress: string;
  let tokenAddress: string;

  const bountyAmount = ethers.parseUnits("100", 18);
  const profileId = BigInt(1); // Asker's profile ID
  const pubId = BigInt(1);     // Publication ID of the question
  const anotherProfileId = BigInt(2); // For 'other'
  let hubAddress: string; // Placeholder for Lens Hub address

  beforeEach(async () => {
    [deployer, asker, expert, other] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    askerAddress = await asker.getAddress();
    expertAddress = await expert.getAddress();
    otherAddress = await other.getAddress();
    hubAddress = deployerAddress; // Use deployer as a placeholder for Hub address

    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployer);
    answerNFT = await NFTFactory.deploy(deployerAddress);
    await answerNFT.waitForDeployment();
    nftAddress = await answerNFT.getAddress();

    const BountyCollectModuleFactory = await ethers.getContractFactory("BountyCollectModule", deployer);
    bountyModule = await BountyCollectModuleFactory.deploy(nftAddress, hubAddress);
    await bountyModule.waitForDeployment();
    moduleAddress = await bountyModule.getAddress();

    await answerNFT.connect(deployer).setModule(moduleAddress);

    const MockERC20Factory = await ethers.getContractFactory("MockERC20", deployer);
    mockERC20 = await MockERC20Factory.deploy("MockToken", "MOCK", 18);
    await mockERC20.waitForDeployment();
    tokenAddress = await mockERC20.getAddress();
    await mockERC20.mint(askerAddress, bountyAmount * BigInt(2));
  });

  async function initializeBountyAsHub(
    currentAsker: Signer = asker,
    currentAskerAddress: string = askerAddress,
    currentProfileId = profileId,
    currentPubId = pubId
  ) {
      const initPublicationActionData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [tokenAddress, bountyAmount]
      );
      await mockERC20.connect(currentAsker).approve(moduleAddress, bountyAmount);
      return bountyModule.connect(deployer).initializePublicationAction(
          currentProfileId,
          currentPubId,
          currentAskerAddress,
          initPublicationActionData
      );
  }

  describe("Deployment", () => {
     it("Should deploy successfully", async () => { expect(moduleAddress).to.not.equal(ethers.ZeroAddress); });
     it("Should set the right owner", async () => { expect(await bountyModule.owner()).to.equal(deployerAddress); });
     it("Should have the NFT address set", async () => { expect(await bountyModule.acceptedAnswerNFT()).to.equal(nftAddress); });
     it("NFT should have the module address set", async () => { expect(await answerNFT.module()).to.equal(moduleAddress); });
  });

  describe("initializePublicationAction", () => {
    it("Should initialize bounty, store data, and escrow funds when called by Hub", async () => {
        const tx = await initializeBountyAsHub();
        // To properly test internal state, BountyCollectModule would need getter functions
        // for _bounties and _isBountyPaid as they are internal.
        // For now, we test via events and balance changes.
        await expect(tx).to.emit(bountyModule, "BountyInitialized").withArgs(profileId, pubId, tokenAddress, bountyAmount, askerAddress);
        expect(await mockERC20.balanceOf(askerAddress)).to.equal(bountyAmount);
        expect(await mockERC20.balanceOf(moduleAddress)).to.equal(bountyAmount);
    });
    it("Should fail if already initialized (when called by Hub)", async () => {
        await initializeBountyAsHub();
        const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, bountyAmount]);
        await expect( bountyModule.connect(deployer).initializePublicationAction(profileId, pubId, askerAddress, initData)
        ).to.be.revertedWith("Bounty: Already initialized");
     });
    it("Should fail with zero amount (when called by Hub)", async () => {
        const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, 0]);
        await mockERC20.connect(asker).approve(moduleAddress, bountyAmount);
        await expect( bountyModule.connect(deployer).initializePublicationAction(profileId, pubId, askerAddress, initData)
        ).to.be.revertedWith("Bounty: Amount must be positive");
      });
     it("Should fail with invalid transaction executor (when called by Hub)", async () => {
         const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, bountyAmount]);
         await mockERC20.connect(asker).approve(moduleAddress, bountyAmount);
         await expect( bountyModule.connect(deployer).initializePublicationAction(profileId, pubId, ethers.ZeroAddress, initData)
         ).to.be.revertedWith("Bounty: Invalid transaction executor");
     });
      it("Should fail if transferFrom fails (insufficient approval, called by Hub)", async () => {
         const insufficientAmount = bountyAmount / BigInt(2);
         await mockERC20.connect(asker).approve(moduleAddress, insufficientAmount);
         const initData = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [tokenAddress, bountyAmount]);
         await expect( bountyModule.connect(deployer).initializePublicationAction(profileId, pubId, askerAddress, initData)
         ).to.be.revertedWithCustomError(mockERC20, "ERC20InsufficientAllowance");
     });
  });

  describe("processPublicationAction", () => {
     beforeEach(async () => {
        await initializeBountyAsHub();
     });

     // Helper function to create ProcessActionParamsStruct
     function createProcessActionParams({
        publicationActedProfileId = profileId,
        publicationActedId = pubId,
        actorProfileId = profileId, // Typically the original asker's profile ID
        actorProfileOwner = askerAddress, // Wallet of the actor profile owner
        transactionExecutor = askerAddress, // Wallet executing the transaction
        actionModuleData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]),
        actionModule = moduleAddress, // Address of this action module
        referrerProfileIds = [],
        referrerPubIds = [],
        referrerPubTypes = []
     }: Partial<Types.ProcessActionParamsStruct>): Types.ProcessActionParamsStruct {
        return {
            publicationActedProfileId,
            publicationActedId,
            actorProfileId,
            actorProfileOwner, // Added this field
            transactionExecutor,
            actionModule,
            actionModuleData,
            referrerProfileIds,
            referrerPubIds,
            referrerPubTypes
        };
     }

     it("Should pay the bounty, mint NFT to the expert, and emit event (when called by Hub)", async () => {
         const params = createProcessActionParams({});

         expect(await mockERC20.balanceOf(expertAddress)).to.equal(0);
         expect(await answerNFT.balanceOf(expertAddress)).to.equal(0);

         const tx = await bountyModule.connect(deployer).processPublicationAction(params);

         await expect(tx).to.emit(bountyModule, "BountyPaid").withArgs(profileId, pubId, expertAddress, bountyAmount);
         await expect(tx).to.emit(answerNFT, "Transfer").withArgs(ethers.ZeroAddress, expertAddress, 0);

         expect(await mockERC20.balanceOf(moduleAddress)).to.equal(0);
         expect(await mockERC20.balanceOf(expertAddress)).to.equal(bountyAmount);
         expect(await answerNFT.balanceOf(expertAddress)).to.equal(1);
         expect(await answerNFT.ownerOf(0)).to.equal(expertAddress);
     });

     it("Should fail if transactionExecutor is not the original asker (when called by Hub)", async () => {
        const params = createProcessActionParams({ transactionExecutor: otherAddress });
        await expect(
            bountyModule.connect(deployer).processPublicationAction(params)
        ).to.be.revertedWith("Bounty: Only asker can accept");
     });

     it("Should fail if bounty is already paid (when called by Hub)", async () => {
        const params = createProcessActionParams({});
        await bountyModule.connect(deployer).processPublicationAction(params); // Pay once
        await expect(
            bountyModule.connect(deployer).processPublicationAction(params)
        ).to.be.revertedWith("Bounty: Already paid");
     });

      it("Should fail if bounty is not initialized (when called by Hub)", async () => {
         const params = createProcessActionParams({
             publicationActedProfileId: anotherProfileId, // Use an uninitialized ID
             publicationActedId: pubId + BigInt(1)        // Use an uninitialized ID
         });
         await expect(
             bountyModule.connect(deployer).processPublicationAction(params)
         ).to.be.revertedWith("Bounty: Not initialized");
      });

      it("Should fail with invalid expert address (when called by Hub)", async () => {
         const params = createProcessActionParams({
             actionModuleData: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ethers.ZeroAddress])
         });
         await expect(
             bountyModule.connect(deployer).processPublicationAction(params)
         ).to.be.revertedWith("Bounty: Invalid expert address");
      });
  });
});
