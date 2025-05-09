import { expect } from "chai";
import { ethers, network } from "hardhat"; // Import network
import { Signer } from "ethers";
import { BountyCollectModule } from "../typechain-types/contracts/BountyCollectModule";
import { AcceptedAnswerNFT } from "../typechain-types/contracts/AcceptedAnswerNFT";
import { MockERC20 } from "../typechain-types/contracts/MockERC20";
import { Types } from "../node_modules/lens-modules/contracts/libraries/constants/Types";

describe("BountyCollectModule", () => {
  let deployer: Signer;
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
  const profileId = BigInt(1);
  const pubId = BigInt(1);
  const anotherProfileId = BigInt(2);
  let hubAddress: string;

  beforeEach(async function() {
    // Increased timeout for beforeEach on testnet
    this.timeout(60000); // 60 seconds for beforeEach on testnet

    console.log(`[Test - beforeEach] Running on network: ${network.name}`);
    const signers = await ethers.getSigners();
    console.log(`[Test - beforeEach] ethers.getSigners() returned ${signers.length} signers.`);

    if (signers.length === 0) {
      console.error("[Test - beforeEach] No signers returned by ethers.getSigners(). This is the root cause.");
      // Attempt to get provider and log network details
      try {
        const providerNetwork = await ethers.provider.getNetwork();
        console.log("[Test - beforeEach] Provider network details:", providerNetwork.toJSON());
        const configuredAccounts = network.config.accounts;
        console.log("[Test - beforeEach] Hardhat configured accounts for this network:", configuredAccounts);
      } catch(e) {
        console.error("[Test - beforeEach] Error getting provider network details:", e);
      }
      throw new Error("No signers available. Check private key in .env and hardhat.config.ts for the selected network.");
    }

    [deployer, asker, expert, other] = signers;
    console.log("[Test - beforeEach] Deployer signer object:", deployer ? 'Exists' : 'UNDEFINED');

    deployerAddress = await deployer.getAddress();
    askerAddress = await asker.getAddress();
    expertAddress = await expert.getAddress();
    otherAddress = await other.getAddress();
    hubAddress = deployerAddress; // Using deployer as mock Hub

    console.log(`[Test - beforeEach] Deployer address: ${deployerAddress}`);

    // Deploy NFT
    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployer);
    answerNFT = await NFTFactory.deploy(deployerAddress);
    await answerNFT.waitForDeployment();
    nftAddress = await answerNFT.getAddress();
    console.log(`[Test - beforeEach] AcceptedAnswerNFT deployed to: ${nftAddress}`);

    // Deploy BountyCollectModule
    const BountyCollectModuleFactory = await ethers.getContractFactory("BountyCollectModule", deployer);
    bountyModule = await BountyCollectModuleFactory.deploy(nftAddress, hubAddress);
    await bountyModule.waitForDeployment();
    moduleAddress = await bountyModule.getAddress();
    console.log(`[Test - beforeEach] BountyCollectModule deployed to: ${moduleAddress}`);

    // Set module in NFT
    await answerNFT.connect(deployer).setModule(moduleAddress);

    // Deploy MockERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20", deployer);
    mockERC20 = await MockERC20Factory.deploy("MockToken", "MOCK", 18);
    await mockERC20.waitForDeployment();
    tokenAddress = await mockERC20.getAddress();
    await mockERC20.mint(askerAddress, bountyAmount * BigInt(2));
    console.log("[Test - beforeEach] Setup complete.");
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
     beforeEach(async function() { // Added function keyword for this.timeout
        this.timeout(60000); // Allow more time for beforeEach on testnet
        await initializeBountyAsHub();
     });

     function createProcessActionParams({
        publicationActedProfileId = profileId,
        publicationActedId = pubId,
        actorProfileId = profileId,
        actorProfileOwner = askerAddress,
        transactionExecutor = askerAddress,
        actionModuleData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]),
        referrerProfileIds = [],
        referrerPubIds = [],
        referrerPubTypes = [] as Types.PublicationType[]
     }: Partial<Types.ProcessActionParamsStruct>): Types.ProcessActionParamsStruct {
        return {
            publicationActedProfileId,
            publicationActedId,
            actorProfileId,
            actorProfileOwner,
            transactionExecutor,
            actionModuleData,
            referrerProfileIds,
            referrerPubIds,
            referrerPubTypes
        };
     }

     it("Should pay the bounty, mint NFT to the expert, and emit event (when called by Hub)", async function() {
         this.timeout(60000); // Allow more time for test on testnet
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

     it("Should fail if transactionExecutor is not the original asker (when called by Hub)", async function() {
        this.timeout(60000);
        const params = createProcessActionParams({ transactionExecutor: otherAddress });
        await expect(
            bountyModule.connect(deployer).processPublicationAction(params)
        ).to.be.revertedWith("Bounty: Only asker can accept");
     });

     it("Should fail if bounty is already paid (when called by Hub)", async function() {
        this.timeout(60000);
        const params = createProcessActionParams({});
        await bountyModule.connect(deployer).processPublicationAction(params);
        await expect(
            bountyModule.connect(deployer).processPublicationAction(params)
        ).to.be.revertedWith("Bounty: Already paid");
     });

      it("Should fail if bounty is not initialized (when called by Hub)", async function() {
         this.timeout(60000);
         const params = createProcessActionParams({
             publicationActedProfileId: anotherProfileId,
             publicationActedId: pubId + BigInt(1)
         });
         await expect(
             bountyModule.connect(deployer).processPublicationAction(params)
         ).to.be.revertedWith("Bounty: Not initialized");
      });

      it("Should fail with invalid expert address (when called by Hub)", async function() {
         this.timeout(60000);
         const params = createProcessActionParams({
             actionModuleData: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ethers.ZeroAddress])
         });
         await expect(
             bountyModule.connect(deployer).processPublicationAction(params)
         ).to.be.revertedWith("Bounty: Invalid expert address");
      });
  });
});
