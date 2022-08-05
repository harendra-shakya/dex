// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./libraries/HelperLibrary.sol";
import "./LiquidityToken.sol";

pragma solidity ^0.8.7;

// TODO: Make interfaces

contract Pool is ReentrancyGuard, LiquidityToken {
    mapping(address => AggregatorV3Interface) s_priceFeeds;

    mapping(address => mapping(address => uint256)) s_providerLiquidity;

    ////////////////////////
    ////   Events   ///////
    //////////////////////

    event Mint(
        address indexed _token1,
        uint256 indexed _amount1,
        address _token2,
        uint256 indexed _amount2
    );

    event Burn(
        address indexed _token1,
        uint256 indexed _amount1,
        address _token2,
        uint256 indexed _amount2
    );

    //////////////////////////
    ///// Main functions /////
    /////////////////////////

    address private token1;
    address private token2;

    constructor(address[2] memory _pairTokens, AggregatorV3Interface[2] memory _priceFeeds) {
        s_priceFeeds[_pairTokens[0]] = AggregatorV3Interface(_priceFeeds[0]);
        s_priceFeeds[_pairTokens[1]] = AggregatorV3Interface(_priceFeeds[1]);
        token1 = _pairTokens[0];
        token2 = _pairTokens[1];
    }

    function mint(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    ) external nonReentrant {}

    uint256 private reserve1;
    uint256 private reserve2;

    function getReserves() public view returns (uint256, uint256) {
        return (reserve1, reserve2);
    }

    function getTokens() public view returns (address, address) {
        return (token1, token2);
    }

    function burn(uint256 _amount, address _to) external nonReentrant {
        (uint256 _reserve1, uint256 _reserve2) = getReserves(); // gas savings
        (address _token1, address _token2) = getTokens();
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 balance2 = IERC20(_token2).balanceOf(address(this));
        uint256 amount1 = balance1 - _reserve1;
        uint256 amount2 = balance2 - _reserve2;

        // calculate
        // burn
        // send back assets
    }

    function swap(
        uint256 _amountOut1,
        uint256 _amountOut2,
        address _to
    ) external nonReentrant {
        address _token1 = token1;
        address _token2 = token2;
        if (_amountOut1 > 0) HelperLibrary._safeTranfer(_token1, _to, _amountOut1);
        if (_amountOut2 > 0) HelperLibrary._safeTranfer(_token2, _to, _amountOut2);

        s_providerLiquidity[_token1][_to] += _amountOut1;

        s_providerLiquidity[_token2][_to] -= _amountOut2;
    }

    function getAmountOut(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) public view returns (uint256 amountOut) {
        (uint256 inPrice, uint256 inDecimals) = getLatestPrice(_tokenIn);
        uint256 totalInLiquidity = (inPrice / 10**inDecimals) *
            IERC20(_tokenIn).balanceOf(address(this));

        (uint256 outPrice, uint256 outDecimals) = getLatestPrice(_tokenOut);
        uint256 totalOutLiquidity = (outPrice / 10**outDecimals) *
            IERC20(_tokenIn).balanceOf(address(this));

        amountOut =
            ((totalOutLiquidity * _amountIn * inPrice) / 10**inDecimals) /
            totalInLiquidity;
    }

    function getLatestPrice(address _token) public view returns (uint256, uint256) {
        (, int256 price, , , ) = s_priceFeeds[_token].latestRoundData();
        uint256 decimals = uint256(s_priceFeeds[_token].decimals());
        return (uint256(price), decimals);
    }
}
