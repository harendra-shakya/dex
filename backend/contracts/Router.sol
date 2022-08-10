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

    constructor(address _factory) {
        factory = _factory;
    }

    function _addLiquidity(
        address _token1,
        address _token2,
        uint256 _amount1,
        uint256 _amount2,
        uint8 _fee
    ) private returns (uint256 amount1, uint256 amount2) {
        require(_fee <= 100, "ROUTER: MAX_FEE_AMOUNT_IS_1%"); // fee not more than 1%
        require(_token1 != _token2, "ROUTER: Same token not allowed");
        require(_amount1 > 0 && _amount2 > 0, "ROUTER: INVALID_AMOUNT");
        address _factory = factory; // gas savings
        address pool = IFactory(_factory).getPoolAddress(_token1, _token2, _fee);
        if (pool == address(0)) {
            IFactory(_factory).createPool(_token1, _token2, _fee);
            pool = IFactory(_factory).getPoolAddress(_token1, _token2, _fee);
        }

        (uint256 reserve1, uint256 reserve2, ) = IPool(pool).getReserves();

        if (reserve1 == 0 && reserve2 == 0) {
            (amount1, amount2) = (_amount1, _amount2);
        } else {
            uint256 amount2Optimal = HelperLibrary.getEqualAmount(_amount1, reserve1, reserve2);

            if (amount2Optimal <= _amount2) {
                (amount1, amount2) = (_amount1, amount2Optimal);
            } else {
                uint256 amount1Optimal = HelperLibrary.getEqualAmount(
                    _amount2,
                    reserve2,
                    reserve1
                );
                require(amount1Optimal <= _amount1, "ROUTER: NOT_OPTIMAL");
                (amount1, amount2) = (amount1Optimal, _amount2);
            }
        }
    }

    // *** Add Liquidity ***
    function addLiquidity(
        address _token1,
        address _token2,
        uint256 _amount1,
        uint256 _amount2,
        uint8 _fee
    ) external nonReentrant {
        (uint256 amount1, uint256 amount2) = _addLiquidity(
            _token1,
            _token2,
            _amount1,
            _amount2,
            _fee
        );
        address _factory = factory; // gas savings
        address _pool = IFactory(_factory).getPoolAddress(_token1, _token2, _fee);
        HelperLibrary._safeTranferFrom(_token1, msg.sender, _pool, amount1);
        HelperLibrary._safeTranferFrom(_token2, msg.sender, _pool, amount2);
        IPool(_pool).mint(msg.sender);
    }

    // *** Remove Liquidity ***
    function removeLiquidity(
        uint256 _liquidity,
        address _token1,
        address _token2,
        uint8 _fee
    ) external nonReentrant {
        address _factory = factory;
        address _pool = IFactory(_factory).getPoolAddress(_token1, _token2, _fee);
        require(_pool != address(0), "ROUTER: Pool doesn't exist");
        require(
            _liquidity > 0 && IERC20(_pool).balanceOf(msg.sender) > 0,
            "ROUTER: Insufficient amount"
        );
        
        require(
            _liquidity <= IERC20(_pool).balanceOf(msg.sender),
            "ROUTER: Insufficient liquidity"
        );

        HelperLibrary._safeTranferFrom(_pool, msg.sender, _pool, _liquidity);
        IPool(_pool).burn(msg.sender);
    }

    // *** Swap *** //
    function _swap(
        uint256 _amountIn,
        address[] memory _path, // path[0] -> tokenIn // path[last] -> tokenOut
        address _to
    ) external nonReentrant {
        require(_path.length >= 2, "ROUTER: INVALID_PATH");
        require(_amountIn > 0, "ROUTER: Insufficient amount");
        address _factory = factory; // gas savings

        HelperLibrary._safeTranferFrom(_path[0], msg.sender, HelperLibrary.getPoolAddress(_factory, _path[0], _path[1]), _amountIn);

        for (uint256 i = 0; i < _path.length - 1; i++) {
            (address tokenIn, address tokenOut) = (_path[i], _path[i + 1]);

            address _pool = HelperLibrary.getPoolAddress(_factory, tokenIn, tokenOut);
            uint256 _amountOut = IPool(_pool).getAmountOut(tokenIn, _amountIn);

            (uint256 amountOut1, uint256 amountOut2) = (uint256(0), _amountOut);
            address to = i < _path.length - 2
                ? HelperLibrary.getPoolAddress(_factory, tokenOut, _path[i + 2]) // sending tokens to next pool
                : _to;

            require(to != address(0), "ROUTER: INVALID_ADDRESS");
            _amountIn = IPool(_pool).swap(amountOut1, amountOut2, to);
        }
    }
}
