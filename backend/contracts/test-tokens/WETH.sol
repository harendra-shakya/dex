// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    constructor() ERC20("Mock Weth", "WETH") {
        _mint(msg.sender, 100000000000000000000000000000000000);
    }
}
