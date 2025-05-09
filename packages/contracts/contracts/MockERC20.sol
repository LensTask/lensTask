// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // OZ v5 ERC20 decimals are fixed at 18 by default.
        // The decimals_ param is kept for test compatibility.
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
