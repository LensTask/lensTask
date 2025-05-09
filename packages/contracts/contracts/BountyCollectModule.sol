// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPublicationActionModule as IActionModule} from "lens-modules/contracts/interfaces/IPublicationActionModule.sol";
import {HubRestricted} from "lens-modules/contracts/base/HubRestricted.sol";
// Import the Types library from lens-modules
import {Types} from "lens-modules/contracts/libraries/constants/Types.sol";

interface IAcceptedAnswerNFT {
    function mint(address to) external returns (uint256 tokenId);
}

contract BountyCollectModule is IActionModule, HubRestricted {

    struct BountyData {
        address bountyCurrency;
        uint256 bountyAmount;
        address asker;
        address selectedExpert;
        bool isInitialized;
    }

    mapping(uint256 => mapping(uint256 => BountyData)) internal _bounties;
    mapping(uint256 => mapping(uint256 => bool)) internal _isBountyPaid;

    address public immutable owner;
    IAcceptedAnswerNFT public immutable acceptedAnswerNFT;

    event BountyInitialized(
        uint256 indexed profileId,
        uint256 indexed pubId,
        address indexed currency,
        uint256 amount,
        address asker
    );
    event BountyPaid(
        uint256 indexed profileId,
        uint256 indexed pubId,
        address indexed expertAddress,
        uint256 amount
    );

    constructor(address nftContractAddress, address hubAddress) HubRestricted(hubAddress) {
        owner = msg.sender;
        require(nftContractAddress != address(0), "Bounty: Invalid NFT address");
        acceptedAnswerNFT = IAcceptedAnswerNFT(nftContractAddress);
    }

    function initializePublicationAction(
        uint256 profileId,
        uint256 pubId,
        address transactionExecutor,
        bytes calldata data // This remains bytes calldata as per IActionModule
    ) external override onlyHub returns (bytes memory) {
        require(!_bounties[profileId][pubId].isInitialized, "Bounty: Already initialized");
        require(transactionExecutor != address(0), "Bounty: Invalid transaction executor");
        (address currency, uint256 amount) = abi.decode(data, (address, uint256)); // Decode from generic bytes
        require(currency != address(0), "Bounty: Invalid currency address");
        require(amount > 0, "Bounty: Amount must be positive");

        _bounties[profileId][pubId] = BountyData({
            bountyCurrency: currency,
            bountyAmount: amount,
            asker: transactionExecutor,
            selectedExpert: address(0),
            isInitialized: true
        });
        emit BountyInitialized(profileId, pubId, currency, amount, transactionExecutor);
        IERC20 token = IERC20(currency);
        bool success = token.transferFrom(transactionExecutor, address(this), amount);
        require(success, "Bounty: ERC20 transferFrom failed");
        return "";
    }

    // Corrected signature to match IPublicationActionModule
    function processPublicationAction(
        Types.ProcessActionParams calldata processActionParams // Use the struct from Lens Types
    ) external override onlyHub returns (bytes memory) {
        // Extract necessary fields from processActionParams struct
        // processActionParams includes:
        // uint256 publicationActedProfileId;
        // uint256 publicationActedId;
        // uint256 actorProfileId;
        // address transactionExecutor;
        // bytes actionModuleData; (This is our old 'processActionParams')

        // For paying the bounty, the key identifiers are from the publication the module is attached to.
        // In IActionModule, pubIdPointing is the publication ID of the action.
        // And profileId is the actor's profile ID.

        // Let's assume the action is on the question itself.
        // The 'actorProfileId' from the struct is the profileId of who initiated this processing (should be asker).
        // The 'publicationActedId' is the pubId of the question.
        // The 'transactionExecutor' is the wallet executing this.

        BountyData storage bounty = _bounties[processActionParams.publicationActedProfileId][processActionParams.publicationActedId];

        require(bounty.isInitialized, "Bounty: Not initialized");
        require(!_isBountyPaid[processActionParams.publicationActedProfileId][processActionParams.publicationActedId], "Bounty: Already paid");
        // Ensure the transaction executor (wallet) is the original asker stored
        require(processActionParams.transactionExecutor == bounty.asker, "Bounty: Only asker can accept");
        // Also ensure the actor profile ID matches the profile that created the bounty (optional check, but good)
        // require(processActionParams.actorProfileId == processActionParams.publicationActedProfileId, "Bounty: Actor must be asker profile");


        // Decode the expert's wallet address from actionModuleData
        (address expertWalletAddress) = abi.decode(processActionParams.actionModuleData, (address));
        require(expertWalletAddress != address(0), "Bounty: Invalid expert address");

        _isBountyPaid[processActionParams.publicationActedProfileId][processActionParams.publicationActedId] = true;
        bounty.selectedExpert = expertWalletAddress;

        IERC20 token = IERC20(bounty.bountyCurrency);
        bool success = token.transfer(expertWalletAddress, bounty.bountyAmount);
        require(success, "Bounty: ERC20 transfer failed");

        acceptedAnswerNFT.mint(expertWalletAddress);

        emit BountyPaid(processActionParams.publicationActedProfileId, processActionParams.publicationActedId, expertWalletAddress, bounty.bountyAmount);

        return abi.encode(expertWalletAddress, bounty.bountyAmount);
    }
}
