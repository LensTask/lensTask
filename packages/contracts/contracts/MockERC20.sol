// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable {
    // Pass decimals to the ERC20 constructor directly (for OZ v5.x)
    // Note: OZ v5 ERC20 decimals are immutable set to 18 by default.
    // We keep the decimals_ param for test compatibility but don't use it to set state.
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_ // Parameter received but not used to set decimals state in OZ v5 base
    ) ERC20(name, symbol) Ownable(msg.sender) { // Initialize Ownable with deployer
        // _setupDecimals does not exist in OZ v5.
        // Decimals are fixed at 18 in the base ERC20 contract unless overridden.
        // If tests depend on the 'decimals_' value, they might need adjustment
        // or a mock that explicitly overrides the decimals() function.
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Override decimals() ONLY if you need to reflect the constructor arg value
    // and your tests rely on it. Otherwise, use the default 18 from ERC20.sol.
    // function decimals() public view virtual override returns (uint8) {
    //     // return decimals_; // This would require storing decimals_ as a state variable if needed.
    //     return 18; // Or return the fixed value used by the base contract
    // }
}
