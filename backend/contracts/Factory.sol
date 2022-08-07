// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Pool.sol";

pragma solidity ^0.8.7;

contract Factory {
    address[] private s_allowedTokens;
    address[2][] private s_allPairs;

    mapping(address => AggregatorV3Interface) s_priceFeeds;

    // token1 & token2 -> pool address
    mapping(address => mapping(address => address)) s_pairTokens;

    constructor(address[] memory _allowedTokens, address[] memory _priceFeeds) {
        s_allowedTokens = _allowedTokens;
        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            s_priceFeeds[_allowedTokens[i]] = AggregatorV3Interface(_priceFeeds[i]);
        }
    }

    function createPool(
        address _token1,
        address _token2,
        uint8 _fee
    ) external {
        require(_token1 != _token2, "Same token not allowed");
        require(s_pairTokens[_token1][_token2] == address(0), "Pair already exist");

        address[2] memory pairTokens = [_token1, _token2];
        Pool _pool = new Pool(pairTokens, _fee);
        s_pairTokens[_token1][_token2] = address(_pool);
        s_pairTokens[_token2][_token1] = address(_pool);
        s_allPairs.push(pairTokens);
    }

    function getPoolAddress(address _token1, address _token2) external view returns (address) {
        return s_pairTokens[_token1][_token2];
    }

    function getLatestPrice(address _token) public view returns (uint256, uint256) {
        (, int256 price, , , ) = s_priceFeeds[_token].latestRoundData();
        uint256 decimals = uint256(s_priceFeeds[_token].decimals());
        return (uint256(price), decimals);
    }
}
