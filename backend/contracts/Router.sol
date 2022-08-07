// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "./Factory.sol";
// import "./Pool.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IFactory.sol";
import "./libraries/HelperLibrary.sol";

// TODO: Make interfaces

pragma solidity ^0.8.7;

contract Router is ReentrancyGuard {
    event LiquidityAdded(
        address indexed token1,
        uint256 indexed amount1,
        address token2,
        uint256 indexed amount2
    );

    event LiquidityRemoved(address indexed token1, address token2, uint256 indexed amount);

    //////////////////////////
    ///// Main functions /////
    /////////////////////////

    address private factory;

    constructor(address _factory) {
        factory = _factory;
    }

    function isAmountEqual(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    ) private view {
        require(_token1 != _token2, "Same token not allowed");
        require(_amount1 > 0 && _amount2 > 0, "Zero amount not allowed");
        (uint256 price1, uint256 decimals1) = IFactory(factory).getLatestPrice(_token1);
        (uint256 price2, uint256 decimals2) = IFactory(factory).getLatestPrice(_token2);

        uint256 token1InUsd = (price1 / decimals1) * _amount1;
        uint256 token2InUsd = (price2 / decimals2) * _amount2;
        require(token1InUsd == token2InUsd, "Amount in USD should be matched");
    }

    // *** Add Liquidity ***
    function addLiquidity(
        address _token1,
        uint256 _amount1,
        address _token2,
        uint256 _amount2
    ) external nonReentrant {
        require(_token1 != _token2, "Same token not allowed");
        address _pool = IFactory(factory).getPoolAddress(_token1, _token2);
        if (_pool == address(0)) IFactory(factory).createPool(_token1, _token2, 30); // 0.3%
        _pool = IFactory(factory).getPoolAddress(_token1, _token2);
        // isAmountEqual(_token1, _amount1, _token2, _amount2);
        HelperLibrary._safeTranferFrom(_token1, msg.sender, _pool, _amount1);
        HelperLibrary._safeTranferFrom(_token2, msg.sender, _pool, _amount2);

        IPool(_pool).mint(msg.sender);

        emit LiquidityAdded(_token1, _amount1, _token2, _amount2);
    }

    // *** Remove Liquidity ***
    function removeLiquidity(
        uint256 _amount,
        address _token1,
        address _token2
    ) external nonReentrant {
        require(_amount > 0, "Insufficient amount");
        address _pool = IFactory(factory).getPoolAddress(_token1, _token2);
        require(_pool != address(0), "Pool doesn't exist");
        require(_amount <= IERC20(_pool).balanceOf(msg.sender), "Insufficient liquidity");

        HelperLibrary._safeTranferFrom(_pool, msg.sender, _pool, _amount);
        IPool(_pool).burn(msg.sender);
        emit LiquidityRemoved(_token1, _token2, _amount);
    }

    // *** Swap *** //
    function _swap(
        uint256 _amountIn,
        address[] memory _path, // path[0] -> tokenIn // path[last] -> tokenOut
        address _to
    ) external nonReentrant {
        require(_path.length >= 2, "Invalid path");
        require(_amountIn > 0, "Insufficient amount");
        HelperLibrary._safeTranferFrom(_path[0], msg.sender, address(this), _amountIn);

        for (uint256 i = 0; i < _path.length; i++) {
            (address tokenIn, address tokenOut) = (_path[i], _path[i + 1]);

            address _pool = IFactory(factory).getPoolAddress(tokenIn, tokenOut);
            uint256 _amountOut = IPool(_pool).getAmountOut(tokenIn, _amountIn);

            (uint256 amountOut1, uint256 amountOut2) = (uint256(0), _amountOut);
            address to = i < _path.length - 2
                ? IFactory(factory).getPoolAddress(tokenOut, _path[i + 2]) // sending tokens to next pool
                : _to;

            _amountIn = IPool(_pool).swap(amountOut1, amountOut2, to);
        }
    }
}
