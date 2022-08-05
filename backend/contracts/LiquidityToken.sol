// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LiquidityToken is ERC20 {
    constructor() ERC20("Liquidity Tokens", "LT") {
        _mint(msg.sender, 100000000000000000000000000000000000);
    }
}
