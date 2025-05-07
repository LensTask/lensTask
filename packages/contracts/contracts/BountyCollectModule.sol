// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/* ────────────── imports we will actually use later ────────────── */
// import { IActionModule } from "lens-modules/interfaces/IActionModule.sol"; // Lens V2 module interface
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";                  // pull & pay bounty
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";            // safety

/* ────────────── skeleton ────────────── */
contract BountyCollectModule {
    /* state */
    // struct Bounty { address currency; uint256 amount; address asker; bool paid; }
    // mapping(bytes32 => Bounty) public bounties;

    /* constructor */
    constructor() {
        // nothing yet
    }

    /* called once when question is published */
    function initialize(bytes32 actionId, bytes calldata data) external {
        // @todo implement escrow logic
    }

    /* called when asker accepts an answer */
    function processAction(
        address caller,
        bytes32 actionId,
        bytes calldata processData
    ) external returns (bytes memory) {
        // @todo implement payout logic
        return "";
    }

    /* events */
    // event BountyPosted(bytes32 indexed id, address indexed asker, uint256 amount);
    // event BountyPaid(bytes32 indexed id, address indexed expert, uint256 amount);
}

/* ────────────── TODOList ──────────────
1. Inherit from IActionModule and ReentrancyGuard.
2. Define Bounty struct + mapping.
3. In initialize():
   • decode (currency, amount, asker)  
   • transferFrom asker → contract  
   • store struct & emit BountyPosted.
4. In processAction():
   • decode expert address  
   • ensure caller == asker && !paid  
   • mark paid, transfer currency to expert  
   • (optionally) mint AcceptedAnswerNFT to expert  
   • emit BountyPaid and return abi-encoded data.
5. Add reclaim() function for expiry refunds (stretch goal).
6. Register the module with LensHub in deploy script.
*/
