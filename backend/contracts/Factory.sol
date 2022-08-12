// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Pool.sol";

pragma solidity ^0.8.7;

contract Factory {
    address[2][] private s_allPairs;

    // token1 & token2 -> pool address
    mapping(address => mapping(address => mapping(uint8 => address))) private s_pairTokens;

    function createPool(
        address _token1,
        address _token2,
        uint8 _fee
    ) external {
        require(_token1 != _token2, "Same token not allowed");
        require(_fee <= 100, "Invalid fee amount");
        require(s_pairTokens[_token1][_token2][_fee] == address(0), "Pair already exist");

        address[2] memory pairTokens = [_token1, _token2];
        Pool _pool = new Pool(pairTokens, _fee);
        s_pairTokens[_token1][_token2][_fee] = address(_pool);
        s_pairTokens[_token2][_token1][_fee] = address(_pool);
        s_allPairs.push(pairTokens);
    }

    function getPoolAddress(
        address _token1,
        address _token2,
        uint8 _fee
    ) external view returns (address) {
        return s_pairTokens[_token1][_token2][_fee];
    }

    function getAllPairs() external view returns (address[2][] memory) {
        return s_allPairs;
    }
}
