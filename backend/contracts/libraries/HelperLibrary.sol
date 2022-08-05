// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Factory.sol";

pragma solidity ^0.8.7;

library HelperLibrary {
    bytes4 private constant T_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 private constant TF_SELECTOR =
        bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));

    function _safeTranfer(
        address token,
        address to,
        uint256 amount
    ) public {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(T_SELECTOR, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer Failed!");
    }

    function _safeTranferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) public {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(TF_SELECTOR, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer Failed!");
    }
}
