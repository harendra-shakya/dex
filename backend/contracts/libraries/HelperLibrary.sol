// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IFactory.sol";
// import "../Factory.sol";

pragma solidity ^0.8.7;

library HelperLibrary {
    bytes4 private constant T_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 private constant TF_SELECTOR =
        bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));

    function _safeTranfer(
        address token,
        address to,
        uint256 amount
    ) internal {
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
    ) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(TF_SELECTOR, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer Failed!");
    }

    function getEqualAmount(
        uint256 amount1,
        uint256 reserve1,
        uint256 reserve2
    ) internal pure returns (uint256 amount2) {
        require(amount1 > 0, "ROUTER: INSUFFICIENT_AMOUNT");
        require(reserve1 > 0 && reserve2 > 0, "ROUTER: INSUFFICIENT_LIQUIDITY");
        amount2 = (amount1 * reserve2) / reserve1;
    }

    function getPoolAddress(address _factory, address _tokenIn, address _tokenOut) internal view returns (address) {
        address pool = IFactory(_factory).getPoolAddress(_tokenIn, _tokenOut, 1); // 0.01%
        if (pool != address(0)) return pool;

        pool = IFactory(_factory).getPoolAddress(_tokenIn, _tokenOut, 30); // 0.3%
        if (pool != address(0)) return pool;

        pool = IFactory(_factory).getPoolAddress(_tokenIn, _tokenOut, 100); // 1%
        return pool;
    }
}
