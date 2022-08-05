// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Pool.sol";

pragma solidity ^0.8.7;

contract Factory {
    
    address[] private s_allowedTokens;
    address[2][] private s_allPairs;

    mapping(address => AggregatorV3Interface) s_priceFeeds;
    mapping(address => mapping(address => mapping(uint256 => address))) s_pairTokens;

    modifier isAllowed(address _token) {
        for (uint256 i = 0; i > s_allowedTokens.length; i++) {
            require(_token == s_allowedTokens[i]);
        }
        _;
    }

    constructor(address[] memory _allowedTokens, address[] memory _priceFeeds) {
        s_allowedTokens = _allowedTokens;
        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            s_priceFeeds[_allowedTokens[i]] = AggregatorV3Interface(_priceFeeds[i]);
        }
    }

    function createPool(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2,
        uint256 _fee
    ) external {
        require(_token1 != _token2, "Same token not allowed");
        require(s_pairTokens[_token1][_token2][_fee] == address(0), "Pair already exist");

        address[2] memory pairTokens = [_token1, _token2];
        AggregatorV3Interface[2] memory priceFeeds = [
            s_priceFeeds[_token1],
            s_priceFeeds[_token2]
        ];

        Pool _pool = new Pool(pairTokens, priceFeeds, _fee);
        _pool.addLiquidity(_token1, _amount1, _token2, _amount2);

        s_pairTokens[_token1][_token2][_fee] = address(_pool);
        s_pairTokens[_token2][_token1][_fee] = address(_pool);
        s_allPairs.push(pairTokens);
    }

    function getPoolAddress(
        address _token1,
        address _token2,
        uint256 _fee
    ) external view returns (address) {
        return s_pairTokens[_token1][_token2][_fee];
    }

    function getSameAmount(address _token1, address _token2)
        external
        view
        returns (uint256 token1PerToken2, uint256 token2PerToken1)
    {
        (uint256 price1, uint256 decimals1) = getLatestPrice(_token1);
        (uint256 price2, uint256 decimals2) = getLatestPrice(_token2);

        token1PerToken2 = (price1 / 10**decimals1) / (price2 / 10**decimals2);
        token2PerToken1 = (price2 / 10**decimals2) / (price1 / 10**decimals1);
    }

    function getLatestPrice(address _token) public view returns (uint256, uint256) {
        (, int256 price, , , ) = s_priceFeeds[_token].latestRoundData();
        uint256 decimals = uint256(s_priceFeeds[_token].decimals());
        return (uint256(price), decimals);
    }
}
