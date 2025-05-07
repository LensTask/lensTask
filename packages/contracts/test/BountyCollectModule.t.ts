import { expect } from "chai";
import { ethers } from "hardhat";

describe("BountyCollectModule Skeleton", () => {
  it("Should deploy", async () => {
    const Module = await ethers.getContractFactory("BountyCollectModule");
    const mod = await Module.deploy();
    await mod.waitForDeployment();
    expect(await mod.getAddress()).to.not.equal(ethers.ZeroAddress);
    console.log("BountyCollectModule (skeleton) deployed to:", await mod.getAddress());
  });

  it("Should have an admin (basic check)", async () => {
    const [deployer] = await ethers.getSigners();
    const Module = await ethers.getContractFactory("BountyCollectModule");
    const mod = await Module.deploy();
    await mod.waitForDeployment();
    expect(await mod.admin()).to.equal(deployer.address);
  });
});

describe("AcceptedAnswerNFT Skeleton", () => {
  it("Should deploy", async () => {
    const NFT = await ethers.getContractFactory("AcceptedAnswerNFT");
    // Pass a dummy address for the constructor if needed
    const nft = await NFT.deploy(ethers.ZeroAddress);
    await nft.waitForDeployment();
    expect(await nft.getAddress()).to.not.equal(ethers.ZeroAddress);
    console.log("AcceptedAnswerNFT (skeleton) deployed to:", await nft.getAddress());
  });
});
