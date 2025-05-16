import { deployContract, getWallet, getActionHubAddress } from "./utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
    const wallet = getWallet();

    const actionHubAddress = getActionHubAddress(hre.network.config.chainId);

    console.log("Deploying AcceptedAnswerNFT...");
    const nftContract = await deployContract(
        "AcceptedAnswerNFT",
        [wallet.address],
        {
            hre,
            wallet,
            verify: true,
        });
    const nftAddress = await nftContract.getAddress();
    console.log(`Deployed at ${nftAddress}`);

    console.log("Deploying BountyPostAction...");
    const bountyContract = await deployContract(
        "BountyPostAction",
        [actionHubAddress],
        {
            hre,
            wallet,
            verify: true,
        });
    const bountyAddress = await bountyContract.getAddress();
    console.log(`Deployed at ${bountyAddress}`);

    console.log(`Setting module address (${bountyAddress}) in NFT contract (${nftAddress})...`);
    const tx = await nftContract.setModule(bountyAddress);
    await tx.wait(1);
    console.log("Module address set successfully in NFT contract.");
    console.log("");
    console.log(`✅ Deployment successful on ${hre.network.name}`);
    console.log("-----------------------------------------------------------------");
    console.log(`AcceptedAnswerNFT:     ${nftAddress}`);
    console.log(`BountyPostAction:      ${bountyAddress}`);
    console.log("-----------------------------------------------------------------");
}