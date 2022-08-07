// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IFactory.sol";
import "./libraries/HelperLibrary.sol";

pragma solidity ^0.8.7;

contract Router is ReentrancyGuard {
    address private factory;

    event LiquidityAdded(
        address indexed token1,
        uint256 indexed amount1,
        address token2,
        uint256 indexed amount2
    );

    event LiquidityRemoved(address indexed token1, address token2, uint256 indexed amount);

    constructor(address _factory) {
        factory = _factory;
    }

    function _addLiquidity(
        address _token1,
        address _token2,
        uint256 _amount1Desired, // amount that liquidity provider want to add
        uint256 _amount2Desired,
        uint256 _amount1Min, // min amount
        uint256 _amount2Min, // i think use it on slipage
        uint8 _fee
    ) private returns (uint256 amount1, uint256 amount2) {
        require(_fee <= 100, "ROUTER: Invalid fee amount"); // fee not more than 1%
        require(_token1 != _token2, "ROUTER: Same token not allowed");
        require(_amount1Desired > 0 && _amount2Desired > 0, "ROUTER: Zero amount not allowed");
        address pool = IFactory(factory).getPoolAddress(_token1, _token2, _fee);
        if (pool == address(0)) IFactory(factory).createPool(_token1, _token2, _fee);
        pool = IFactory(factory).getPoolAddress(_token1, _token2, _fee);

        (uint256 reserve1, uint256 reserve2,) = IPool(pool).getReserves();

        if(reserve1 == 0 && reserve2 == 0) {
            (amount1, amount2) = (_amount1Desired, _amount2Desired);
        } else {
            uint256 amount2Optimal = HelperLibrary.getEqualAmount(_amount1Desired, reserve1, reserve2);

            if(amount2Optimal <= _amount2Desired) {
                require(amount2Optimal >= _amount2Min, "ROUTER: INSUFFICIENT_AMOUNT_2");
                (amount1, amount2) = (_amount1Desired, amount2Optimal);
            } else {
                uint256 amount1Optimal = HelperLibrary.getEqualAmount(_amount2Desired, reserve2, reserve1);
                require(amount1Optimal <= _amount1Desired, "ROUTER: NOT_OPTIMAL");
                require(amount1Optimal >= _amount1Min, "ROUTER: INSUFFICIENT_AMOUNT_1");
                (amount1, amount2) = (amount1Optimal, _amount2Desired);
            }
        }

    }

    // *** Add Liquidity ***
    function addLiquidity(
        address _token1,
        address _token2,
        uint256 _amount1Desired, // amount that liquidity provider want to add
        uint256 _amount2Desired,
        uint256 _amount1Min, // min amount
        uint256 _amount2Min, // i think use it on slippage 
        uint8 _fee
    ) external nonReentrant {
        (uint256 amount1, uint256 amount2) = _addLiquidity(
            _token1,
            _token2,
            _amount1Desired,
            _amount2Desired,
            _amount1Min,
            _amount2Min,
            _fee
        );

        address _pool = IFactory(factory).getPoolAddress(_token1, _token2, _fee);
        HelperLibrary._safeTranferFrom(_token1, msg.sender, _pool, amount1);
        HelperLibrary._safeTranferFrom(_token2, msg.sender, _pool, amount2);
        IPool(_pool).mint(msg.sender);
        emit LiquidityAdded(_token1, amount1, _token2, amount2);
    }

    // *** Remove Liquidity ***
    function removeLiquidity(
        uint256 _liquidity,
        address _token1,
        address _token2,
        uint8 _fee
    ) external nonReentrant {
        address _pool = IFactory(factory).getPoolAddress(_token1, _token2, _fee);
        require(_liquidity > 0, "ROUTER: Insufficient amount");
        require(_pool != address(0), "ROUTER: Pool doesn't exist");
        require(_liquidity <= IERC20(_pool).balanceOf(msg.sender), "ROUTER: Insufficient liquidity");

        HelperLibrary._safeTranferFrom(_pool, msg.sender, _pool, _liquidity);
        IPool(_pool).burn(msg.sender);
        emit LiquidityRemoved(_token1, _token2, _liquidity);
    }

    // *** Swap *** //
    function _swap(
        uint256 _amountIn,
        address[] memory _path, // path[0] -> tokenIn // path[last] -> tokenOut
        address _to
    ) external nonReentrant {
        require(_path.length >= 2, "ROUTER: INVALID_PATH");
        require(_amountIn > 0, "ROUTER: Insufficient amount");
        HelperLibrary._safeTranferFrom(_path[0], msg.sender, address(this), _amountIn);

        for (uint256 i = 0; i < _path.length; i++) {
            (address tokenIn, address tokenOut) = (_path[i], _path[i + 1]);

            address _pool = getPool(tokenIn, tokenOut);
            uint256 _amountOut = IPool(_pool).getAmountOut(tokenIn, _amountIn);

            (uint256 amountOut1, uint256 amountOut2) = (uint256(0), _amountOut);
            address to = i < _path.length - 2
                ? getPool(tokenOut, _path[i + 2]) // sending tokens to next pool
                : _to;

            require(to != address(0), "ROUTER: INVALID_ADDRESS");
            _amountIn = IPool(_pool).swap(amountOut1, amountOut2, to);
        }
    }

    function getPool(address _tokenIn, address _tokenOut) private view returns (address) {
        address pool = IFactory(factory).getPoolAddress(_tokenIn, _tokenOut, 1); // 0.01%
        if (pool != address(0)) return pool;

        pool = IFactory(factory).getPoolAddress(_tokenIn, _tokenOut, 30); // 0.3%
        if (pool != address(0)) return pool;

        pool = IFactory(factory).getPoolAddress(_tokenIn, _tokenOut, 100); // 1%
        return pool;
    }
}
