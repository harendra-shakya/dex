// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GenericERC20 is ERC20 {
    uint8 private dec = 18;

    constructor(
        string memory name,
        string memory symbol,
        uint8 _dec
    ) ERC20(name, symbol) {
        dec = _dec;
        _mint(msg.sender, 10000000000000 * 10**_dec);
    }

    function decimals() public view override returns (uint8 _dec) {
        _dec = dec;
    }
}