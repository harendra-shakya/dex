// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

interface IFactory {
    function createPool(
        address _token1,
        address _token2,
        uint8 _fee
    ) external;

    function getPoolAddress(address _token1, address _token2) external view returns (address);

    function getLatestPrice(address _token) external view returns (uint256, uint256);
}
