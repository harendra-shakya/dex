// SPDX-License-Identifier: MIT

import "./Pool.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

pragma solidity ^0.8.7;

contract Dex {
    // first build liquidity pools
    // then build swap function
    address[] private s_allowedTokens;
    address[2][] private s_allPairs;
    // mapping(address => address[2]) s_pairTokens;
    mapping(address => AggregatorV3Interface) s_priceFeeds;
    mapping(address => mapping(address => address)) s_pairTokens;

    modifier isAllowed(address _token) {
        for (uint256 i = 0; i > s_allowedTokens.length; i++) {
            require(_token == s_allowedTokens[i]);
        }
        _;
    }

    constructor(address[] memory _priceFeeds) {
        for (uint256 i = 0; i < s_allowedTokens.length; i++) {
            s_priceFeeds[s_allowedTokens[i]] = AggregatorV3Interface(_priceFeeds[i]);
        }
    }

    function createPool(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2,
        uint256 _fee
    ) external {
        uint256 token1InUsd = uint256(getLatestPrice(_token1)) * _amount1;
        uint256 token2InUsd = uint256(getLatestPrice(_token2)) * _amount2;

        require(_token1 != _token2, "Same token not allowed");
        require(s_pairTokens[_token1][_token2] == address(0), "Pair already exist");
        require(token1InUsd == token2InUsd, "Amount in USD should be matched");

        address[2] memory pairTokens = [_token1, _token2];
        AggregatorV3Interface[2] memory priceFeeds = [
            s_priceFeeds[_token1],
            s_priceFeeds[_token2]
        ];

        Pool _pool = new Pool(pairTokens, priceFeeds, _fee);

        s_pairTokens[_token1][_token2] = address(_pool);
        s_pairTokens[_token2][_token1] = address(_pool);
        s_allPairs.push(pairTokens);
    }

    function getLatestPrice(address _token) public view returns (int256) {
        AggregatorV3Interface priceFeed = s_priceFeeds[_token];

        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
