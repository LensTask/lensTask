import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import { BountyCollectModule } from "../typechain-types/contracts/BountyCollectModule";
import { AcceptedAnswerNFT } from "../typechain-types/contracts/AcceptedAnswerNFT";
import { MockERC20 } from "../typechain-types/contracts/MockERC20";
import { Types } from "../node_modules/lens-modules/contracts/libraries/constants/Types";

describe("BountyCollectModule (Integration Testnet - Happy Path)", function () {
  this.timeout(300000); // 5 minutes for all testnet interactions

  let deployerAndUser: Signer; // Single signer for all roles on testnet

  let deployerAddress: string; // Will be the same as askerAddress and expertAddress for testnet
  let askerAddress: string;
  let expertAddress: string;
  let nftAddress: string;
  let moduleAddress: string;
  let tokenAddress: string;
  let hubAddress: string;

  let bountyModule: BountyCollectModule;
  let answerNFT: AcceptedAnswerNFT;
  let mockERC20: MockERC20;

  const bountyAmount = ethers.parseUnits("0.001", 18);
  const profileId = BigInt(1); // Example Asker's Profile ID
  const pubId = BigInt(1);     // Example Publication ID for the question

  before(async function () {
    if (network.name !== "lensSepolia") {
      console.log(`Not on lensSepolia network (current: ${network.name}), skipping integration tests.`);
      this.skip();
      return;
    }

    console.log("Running Integration Testnet tests on:", network.name);
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        console.error("[Testnet Test] ERROR: No signers returned. Check Hardhat network config and private key.");
        throw new Error("No signers available for deployment on lensSepolia.");
    }
    deployerAndUser = signers[0]; // Use the first (and only) signer for all roles

    deployerAddress = await deployerAndUser.getAddress();
    askerAddress = deployerAddress;    // Asker is the deployer
    expertAddress = deployerAddress;   // Expert is also the deployer for this test
    hubAddress = deployerAddress;      // Deployer acts as Hub

    console.log("Using single account for Deployer/Asker/Expert/Hub:", deployerAddress);
    const balance = await ethers.provider.getBalance(deployerAddress);
    console.log("Account GRASS balance:", ethers.formatUnits(balance, 18));
     if (balance < ethers.parseUnits("0.02", 18)) { // Increased check for more txs
        console.warn("WARNING: Deployer account has low GRASS balance for integration tests.");
    }

    console.log("Deploying MockERC20 to Lens Testnet...");
    const MockERC20Factory = await ethers.getContractFactory("MockERC20", deployerAndUser);
    mockERC20 = await MockERC20Factory.deploy("MockBountyToken", "MBT", 18);
    await mockERC20.waitForDeployment();
    tokenAddress = await mockERC20.getAddress();
    console.log(`MockERC20 deployed to: ${tokenAddress}`);

    console.log(`Minting ${ethers.formatUnits(bountyAmount, 18)} MBT to asker/deployer (${askerAddress})...`);
    const mintTx = await mockERC20.connect(deployerAndUser).mint(askerAddress, bountyAmount);
    await mintTx.wait(1);
    console.log("Minting complete. Asker MBT balance:", ethers.formatUnits(await mockERC20.balanceOf(askerAddress), 18));

    console.log("Deploying AcceptedAnswerNFT to Lens Testnet...");
    const NFTFactory = await ethers.getContractFactory("AcceptedAnswerNFT", deployerAndUser);
    answerNFT = await NFTFactory.deploy(deployerAddress);
    await answerNFT.waitForDeployment();
    nftAddress = await answerNFT.getAddress();
    console.log(`AcceptedAnswerNFT deployed to: ${nftAddress}`);

    console.log("Deploying BountyCollectModule to Lens Testnet...");
    const ModuleFactory = await ethers.getContractFactory("BountyCollectModule", deployerAndUser);
    bountyModule = await ModuleFactory.deploy(nftAddress, hubAddress);
    await bountyModule.waitForDeployment();
    moduleAddress = await bountyModule.getAddress();
    console.log(`BountyCollectModule deployed to: ${moduleAddress}`);

    console.log("Setting module in AcceptedAnswerNFT...");
    const setModuleTx = await answerNFT.connect(deployerAndUser).setModule(moduleAddress);
    await setModuleTx.wait(1);
    console.log("Module set in NFT contract.");
    console.log("'before all' hook for integration tests completed.");
  });

  it("Happy Path: Asker initializes bounty, then accepts an answer, paying expert and minting NFT", async function () {
    if (network.name !== "lensSepolia") this.skip();

    console.log("Step 1: Initializing bounty...");
    const initPublicationActionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [tokenAddress, bountyAmount]
    );
    // Asker (deployerAndUser) approves the module to spend their tokens
    await mockERC20.connect(deployerAndUser).approve(moduleAddress, bountyAmount);
    console.log(`Asker (${askerAddress}) approved module (${moduleAddress}) for ${ethers.formatUnits(bountyAmount, 18)} MBT`);

    // Deployer (acting as Hub) calls initialize, specifying askerAddress as the fund provider
    const initTx = await bountyModule.connect(deployerAndUser).initializePublicationAction(
        profileId,
        pubId,
        askerAddress, // Asker's wallet address (which is deployerAddress here)
        initPublicationActionData
    );
    await initTx.wait(1);
    console.log("Bounty initialized. Tx:", initTx.hash);

    // Asker started with 'bountyAmount' (from minting) and approved 'bountyAmount'.
    // After transferFrom, asker's balance of MBT should be 0.
    expect(await mockERC20.balanceOf(askerAddress)).to.equal(0);
    expect(await mockERC20.balanceOf(moduleAddress)).to.equal(bountyAmount);
    console.log("Funds successfully escrowed by the module.");

    console.log("Step 2: Processing action to pay expert...");
    const actionModuleData = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [expertAddress]); // expertAddress is deployerAddress
    const processActionParams: Types.ProcessActionParamsStruct = {
        publicationActedProfileId: profileId,
        publicationActedId: pubId,
        actorProfileId: profileId,
        actorProfileOwner: askerAddress, // Asker's wallet
        transactionExecutor: askerAddress, // Asker's wallet is executing
        actionModuleData: actionModuleData,
        referrerProfileIds: [],
        referrerPubIds: [],
        referrerPubTypes: []
    };

    // Deployer (acting as Hub) calls processPublicationAction
    const processTx = await bountyModule.connect(deployerAndUser).processPublicationAction(processActionParams);
    await processTx.wait(1);
    console.log("Action processed. Tx:", processTx.hash);

    expect(await mockERC20.balanceOf(moduleAddress)).to.equal(0);
    expect(await mockERC20.balanceOf(expertAddress)).to.equal(bountyAmount); // Expert (deployer) received bounty
    console.log("Bounty successfully paid to expert.");

    expect(await answerNFT.balanceOf(expertAddress)).to.equal(1); // Expert (deployer) received 1 NFT
    expect(await answerNFT.ownerOf(0)).to.equal(expertAddress); // Token ID 0 minted to expert (deployer)
    console.log("NFT successfully minted to expert.");

    await expect(processTx).to.emit(bountyModule, "BountyPaid").withArgs(profileId, pubId, expertAddress, bountyAmount);
    await expect(processTx).to.emit(answerNFT, "Transfer").withArgs(ethers.ZeroAddress, expertAddress, 0);
  });
});
