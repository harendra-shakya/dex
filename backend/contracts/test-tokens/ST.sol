// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ST is ERC20 {
    constructor() ERC20("Stark Token", "ST") {
        _mint(msg.sender, 10000000000000000000000000000000);
    }
}
