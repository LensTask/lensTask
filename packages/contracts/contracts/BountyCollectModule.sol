// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Import from lens-modules (assuming this is the V3 compatible interface)
import {IPublicationActionModule as IActionModule} from "lens-modules/contracts/interfaces/IPublicationActionModule.sol";
import {Types} from "lens-modules/contracts/libraries/constants/Types.sol";
// REMOVED: import {HubRestricted} from "lens-modules/contracts/base/HubRestricted.sol";

interface IAcceptedAnswerNFT {
    function mint(address to) external returns (uint256 tokenId);
}

// REMOVED: HubRestricted from inheritance
contract BountyCollectModule is IActionModule {

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

    // Constructor now only takes nftContractAddress
    constructor(address nftContractAddress) {
        owner = msg.sender;
        require(nftContractAddress != address(0), "Bounty: Invalid NFT address");
        acceptedAnswerNFT = IAcceptedAnswerNFT(nftContractAddress);
    }

    // initializePublicationAction signature from IActionModule
    // REMOVED: onlyHub modifier
    function initializePublicationAction(
        uint256 profileId,
        uint256 pubId,
        address transactionExecutor,
        bytes calldata data
    ) external override /* onlyHub */ returns (bytes memory) {
        // TODO: Add access control if not relying on HubRestricted's onlyHub
        // For V3, this might be msg.sender == LENS_DISPATCHER_ADDRESS

        require(!_bounties[profileId][pubId].isInitialized, "Bounty: Already initialized");
        require(transactionExecutor != address(0), "Bounty: Invalid transaction executor");
        (address currency, uint256 amount) = abi.decode(data, (address, uint256));
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

    // processPublicationAction signature from IActionModule
    // REMOVED: onlyHub modifier
    function processPublicationAction(
        Types.ProcessActionParams calldata processActionParams
    ) external override /* onlyHub */ returns (bytes memory) {
        // TODO: Add access control if not relying on HubRestricted's onlyHub
        // For V3, this might be msg.sender == LENS_DISPATCHER_ADDRESS

        BountyData storage bounty = _bounties[processActionParams.publicationActedProfileId][processActionParams.publicationActedId];
        require(bounty.isInitialized, "Bounty: Not initialized");
        require(!_isBountyPaid[processActionParams.publicationActedProfileId][processActionParams.publicationActedId], "Bounty: Already paid");
        require(processActionParams.transactionExecutor == bounty.asker, "Bounty: Only asker can accept");
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