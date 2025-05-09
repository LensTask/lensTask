// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface for the NFT contract
interface IAcceptedAnswerNFT {
    function mint(address to) external returns (uint256 tokenId);
}

contract BountyCollectModule { // Not inheriting IActionModule yet

    // === State Variables ===
    struct BountyData {
        address bountyCurrency;
        uint256 bountyAmount;
        address asker;
        address selectedExpert;
        bool isInitialized;
    }
    mapping(bytes32 => BountyData) public bountyStore;
    mapping(bytes32 => bool) public paid;
    address public owner;
    IAcceptedAnswerNFT public acceptedAnswerNFT; // Store NFT contract address

    // === Events ===
    event BountyInitialized(bytes32 indexed actionId, address indexed currency, uint256 amount, address indexed asker);
    event BountyPaid(bytes32 indexed actionId, address indexed expert, uint256 amount);
    event AnswerNFTSet(address indexed nftContract); // Event for setting NFT address

    // === Constructor ===
    // Now takes the NFT contract address
    constructor(address nftContractAddress) {
        owner = msg.sender;
        require(nftContractAddress != address(0), "Bounty: Invalid NFT address");
        acceptedAnswerNFT = IAcceptedAnswerNFT(nftContractAddress);
        emit AnswerNFTSet(nftContractAddress);
    }

    // === Initialize Function ===
    function initialize(bytes32 actionId, address asker, bytes calldata data) external {
        require(!bountyStore[actionId].isInitialized, "Bounty: Already initialized");
        require(asker != address(0), "Bounty: Invalid asker address");
        (address currency, uint256 amount) = abi.decode(data, (address, uint256));
        require(currency != address(0), "Bounty: Invalid currency address");
        require(amount > 0, "Bounty: Amount must be positive");

        bountyStore[actionId] = BountyData({
            bountyCurrency: currency,
            bountyAmount: amount,
            asker: asker,
            selectedExpert: address(0),
            isInitialized: true
        });
        emit BountyInitialized(actionId, currency, amount, asker);

        IERC20 token = IERC20(currency);
        bool success = token.transferFrom(asker, address(this), amount);
        require(success, "Bounty: ERC20 transferFrom failed");
    }

    // === Process Action Function ===
    function processAction(
        bytes32 actionId,
        address actor,
        bytes calldata processData
    ) external returns (bytes memory data) {
        BountyData storage bounty = bountyStore[actionId];

        require(bounty.isInitialized, "Bounty: Not initialized");
        require(!paid[actionId], "Bounty: Already paid");
        require(actor == bounty.asker, "Bounty: Only asker can accept");

        (address expertAddress) = abi.decode(processData, (address));
        require(expertAddress != address(0), "Bounty: Invalid expert address");

        paid[actionId] = true;
        bounty.selectedExpert = expertAddress;

        // --- Payout ---
        IERC20 token = IERC20(bounty.bountyCurrency);
        bool success = token.transfer(expertAddress, bounty.bountyAmount);
        require(success, "Bounty: ERC20 transfer failed");

        // --- Mint NFT ---
        // Check if NFT contract address is set (should be by constructor)
        if (address(acceptedAnswerNFT) != address(0)) {
             acceptedAnswerNFT.mint(expertAddress); // Mint NFT to the expert
        }

        emit BountyPaid(actionId, expertAddress, bounty.bountyAmount);

        return "";
    }
}
