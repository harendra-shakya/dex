// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

pragma solidity ^0.8.7;

contract Pool is ReentrancyGuard {
    // first build liquidity pools
    // then build swap function
    address[] private s_pairTokens;
    uint256 private immutable fee;
    bytes4 private constant T_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 private constant TF_SELECTOR =
        bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));

    // AggregatorV3Interface internal priceFeed1;
    // AggregatorV3Interface internal priceFeed2;

    mapping(address => AggregatorV3Interface) s_priceFeeds;

    // tokenAddress & user => his liquidity added
    mapping(address => mapping(address => uint256)) s_liquidity;
    mapping(address => uint256) s_totalLiquidity;

    ///////////////////////
    ////   Events   ///////
    //////////////////////

    event LiquidityAdded(
        address indexed _token1,
        uint256 indexed _amount1,
        address _token2,
        uint256 indexed _amount2
    );
    event LiquidityRemoved(
        address indexed _token1,
        uint256 indexed _amount1,
        address _token2,
        uint256 indexed _amount2
    );

    modifier isPairedToken(
        address _token1,
        address _token2
    ) {
        bool allowed1;
        bool allowed2;

        for (uint256 i = 0; i > s_pairTokens.length; i++) {
            if (_token1 == s_pairTokens[i]) allowed1 = true;
            if (_token2 == s_pairTokens[i]) allowed2 = true;
        }

        require(allowed1 && allowed2, "Not a pair token");
        _;
    }

    modifier isAllowed(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    ) {
        require(_token1 != _token2, "Same token not allowed");

        bool allowed1;
        bool allowed2;

        for (uint256 i = 0; i > s_pairTokens.length; i++) {
            if (_token1 == s_pairTokens[i]) allowed1 = true;
            if (_token2 == s_pairTokens[i]) allowed2 = true;
        }

        require(allowed1 && allowed2, "Not a pair token");

        uint256 token1InUsd = uint256(getLatestPrice(_token1)) * _amount1;
        uint256 token2InUsd = uint256(getLatestPrice(_token2)) * _amount2;
        require(token1InUsd == token2InUsd, "Amount in USD should be matched");
        _;
    }

    /////////////////////////
    ///// Main functions ////
    /////////////////////////

    constructor(
        address[2] memory _pairTokens,
        AggregatorV3Interface[2] memory _priceFeeds,
        uint256 _fee
    ) {
        s_pairTokens = _pairTokens;
        s_priceFeeds[_pairTokens[0]] = AggregatorV3Interface(_priceFeeds[0]);
        s_priceFeeds[_pairTokens[1]] = AggregatorV3Interface(_priceFeeds[1]);
        fee = _fee;
    }

    function addLiquidity(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    )
        external
        isAllowed(_token1, _amount1, _token2, _amount2)
        nonReentrant
    {
        _addLiquidity(_token1, _amount1, _token2, _amount2);
        emit LiquidityAdded(_token1, _amount1, _token2, _amount2);
    }

    function removeLiquidity(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    )
        external
        isAllowed(_token1, _amount1, _token2, _amount2)
        nonReentrant
    {
        require(
            s_liquidity[_token1][msg.sender] >= _amount1 &&
                s_liquidity[_token2][msg.sender] >= _amount2,
            "Not enough liquidity"
        );

        _removeLiquidity(_token1, _amount1, _token2, _amount2);
        emit LiquidityRemoved(_token1, _amount1, _token2, _amount2);
    }

    mapping(address => uint256) s_fees;

    function swap(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    )   external 
        nonReentrant
    {   
        require(_tokenIn != _tokenOut, "Same token not allowed");
        uint256 _amountOut = getAmount(_tokenIn, _amountIn, _tokenOut);

        _safeTranferFrom(_tokenIn, msg.sender, address(this), _amountIn);
        _safeTranfer(_tokenOut, msg.sender, _amountOut);

        s_totalLiquidity[_tokenIn] += _amountIn;
        s_liquidity[_tokenIn][msg.sender] += _amountIn;

        s_totalLiquidity[_tokenOut] -= _amountOut;
        s_liquidity[_tokenOut][msg.sender] -= _amountOut;
    }

    function getAmount(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) public view returns (uint256) {
        return (s_totalLiquidity[_tokenIn] * _amountIn) / s_totalLiquidity[_tokenOut];
    }

    /////////////////////////////
    ////// Helper functions /////
    ////////////////////////////

    function _safeTranfer(
        address token,
        address to,
        uint256 amount
    ) private {
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
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(TF_SELECTOR, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer Failed!");
    }

    function _addLiquidity(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    ) private {
        _safeTranferFrom(_token1, msg.sender, address(this), _amount1);
        _safeTranferFrom(_token2, msg.sender, address(this), _amount2);

        s_liquidity[_token1][msg.sender] += _amount1;
        s_liquidity[_token2][msg.sender] += _amount2;
        s_totalLiquidity[_token1] += _amount1;
        s_totalLiquidity[_token2] += _amount2;
    }

    function _removeLiquidity(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    ) private {
        s_liquidity[_token1][msg.sender] -= _amount1;
        s_liquidity[_token2][msg.sender] -= _amount2;
        s_totalLiquidity[_token1] -= _amount1;
        s_totalLiquidity[_token2] -= _amount2;

        _safeTranfer(_token1, msg.sender, _amount1);
        _safeTranfer(_token2, msg.sender, _amount2);
    }

    function getLatestPrice(address _token) public view returns (int256) {
        AggregatorV3Interface priceFeed = s_priceFeeds[_token];

        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
