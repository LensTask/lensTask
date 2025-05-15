// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Use direct RELATIVE paths from this file to the OZ files in node_modules
// Use direct RELATIVE paths from this file to the OZ files in node_modules
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AcceptedAnswerNFT is ERC721, Ownable {
    address public module;
    uint256 private _nextTokenId;

    modifier onlyModule() {
        require(msg.sender == module, "AcceptedAnswerNFT: Only module can mint");
        _;
    }

    constructor(address initialOwner) ERC721("Accepted Answer", "ANSWER") Ownable(initialOwner) {}

    function setModule(address moduleAddress) external onlyOwner {
        require(module == address(0), "AcceptedAnswerNFT: Module already set");
        require(moduleAddress != address(0), "AcceptedAnswerNFT: Invalid module address");
        module = moduleAddress;
    }

    function mint(address to) external onlyModule returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 /* firstTokenId */,
        uint256 /* batchSize */
    ) internal pure /* override */ {
        require(from == address(0) || to == address(0), "AcceptedAnswerNFT: Soulbound, non-transferable");
    }
}