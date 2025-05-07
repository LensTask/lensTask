// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/* ────────────── imports we will actually use later ────────────── */
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";   // full ERC-721
// import "@openzeppelin/contracts/access/Ownable.sol";         // simple access control

/* ────────────── skeleton ────────────── */
contract AcceptedAnswerNFT {
    /* state */
    address public immutable MODULE;     // will store BountyCollectModule
    uint256 private _id;                 // incremental tokenId

    /* constructor */
    constructor(address moduleAddress) {
        MODULE = moduleAddress;
    }

    /* mint soul-bound badge */
    function mint(address to) external returns (uint256 tokenId) {
        // @todo implement
        return 0;
    }

    /* non-transferable guard */
    // @todo override _beforeTokenTransfer when we extend ERC721

    /* events */
    // event AnswerBadgeMinted(address indexed expert, uint256 indexed tokenId);
}

/* ────────────── TODOList ──────────────
1. Extend ERC721 and Ownable.
2. Add onlyModule modifier (caller must be MODULE).
3. Increment _id and _safeMint in mint().
4. Make token soul-bound by reverting transfers except mint/burn.
5. Emit AnswerBadgeMinted in mint().
6. (Optional) override tokenURI for custom metadata.
*/
