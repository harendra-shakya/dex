// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./libraries/HelperLibrary.sol";
import "./LiquidityToken.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

pragma solidity ^0.8.7;

// TODO: Make interfaces

contract Pool is ReentrancyGuard, LiquidityToken {
    using SafeMath for uint256;

    uint256 private constant MINIMUM_LIQUIDITY = 1000;
    address private token1;
    address private token2;
    uint120 private reserve1;
    uint120 private reserve2;
    uint8 private fee;

    event Mint(
        uint256 indexed liquidityAmount,
        address token1,
        uint256 indexed amount1,
        address token2,
        uint256 indexed amount2
    );

    event Burn(
        uint256 indexed liquidityAmount,
        address token1,
        uint256 indexed amount1,
        address token2,
        uint256 indexed amount2
    );

    event Swap(
        address indexed token1,
        uint256 indexed amount1,
        address token2,
        uint256 indexed amount2
    );

    //////////////////////////
    ///// Main functions /////
    /////////////////////////

    constructor(address[2] memory _pair, uint8 _fee) {
        token1 = _pair[0];
        token2 = _pair[1];
        fee = _fee;
    }

    function mint(address _to) external nonReentrant returns (uint256 liquidity) {
        (uint120 _reserve1, uint120 _reserve2, ) = getReserves(); // gas savings
        (address _token1, address _token2) = getTokens(); // gas savings
        uint256 _totalSupply = totalSupply; // gas savings
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 balance2 = IERC20(_token2).balanceOf(address(this));
        uint256 amount1 = balance1 - _reserve1;
        uint256 amount2 = balance2 - _reserve2;

        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount1 * amount2).sub(MINIMUM_LIQUIDITY);
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity =
                (((amount1 * _totalSupply) / _reserve1) + ((amount2 * _totalSupply) / _reserve2)) /
                2;
        }

        require(liquidity > 0, "POOL: MINT_INSUFFICIENT_LIQUIDITY");
        _mint(_to, liquidity);
        reserve1 = uint120(balance1);
        reserve2 = uint120(balance2);
        emit Mint(liquidity, token1, amount1, token2, amount2);
    }

    function burn(address _to) external nonReentrant returns (uint256 amount1, uint256 amount2) {
        (uint120 _reserve1, uint120 _reserve2, ) = getReserves(); // gas savings
        (address _token1, address _token2) = getTokens(); // gas savings
        uint256 _totalSupply = totalSupply; // gas savings
        uint256 liquidityAmount = balanceOf[address(this)];
        amount1 = (liquidityAmount * _reserve1) / _totalSupply;
        amount2 = (liquidityAmount * _reserve2) / _totalSupply;
        require(amount1 > 0 && amount2 > 0, "POOL: INSUFFICIENT_AMOUNT");
        require(liquidityAmount > 0, "POOL: BURN_INSUFFICIENT_AMOUNT");

        _burn(address(this), liquidityAmount);
        HelperLibrary._safeTranfer(_token1, _to, amount1);
        HelperLibrary._safeTranfer(_token2, _to, amount2);

        reserve1 = uint120(IERC20(_token1).balanceOf(address(this)));
        reserve2 = uint120(IERC20(_token2).balanceOf(address(this)));
        emit Burn(liquidityAmount, _token1, amount1, _token2, amount2);
    }

    function swap(
        uint256 _amountOut1,
        uint256 _amountOut2,
        address _to
    ) external nonReentrant returns (uint256 amountOut) {
        (uint120 _reserve1, uint120 _reserve2, ) = getReserves(); // gas savings
        require(_amountOut1 > 0 || _amountOut2 > 0, "POOL: SWAP_INSUFFICIENT_AMOUNT");
        require(
            _amountOut1 < _reserve1 && _amountOut2 < _reserve2,
            "POOL: SWAP_INSUFFICIENT_LIQUIDITY"
        );

        (address _token1, address _token2) = getTokens(); // gas savings
        if (_amountOut1 > 0) HelperLibrary._safeTranfer(_token1, _to, _amountOut1);
        if (_amountOut2 > 0) HelperLibrary._safeTranfer(_token2, _to, _amountOut2);

        amountOut = _amountOut1 > 0 ? _amountOut1 : _amountOut2;
        reserve1 = uint120(IERC20(_token1).balanceOf(address(this)));
        reserve2 = uint120(IERC20(_token2).balanceOf(address(this)));
        emit Swap(_token1, _amountOut1, _token2, _amountOut2);
    }

    function getAmountOut(address _tokenIn, uint256 _amountIn)
        external
        view
        returns (uint256 amountOut)
    {
        // deci -> 2 (mutiple fee by 100 in frontend)
        (uint256 _reserve1, uint256 _reserve2, uint8 _fee) = getReserves();
        (address _token1, ) = getTokens();

        (uint256 reserveIn, uint256 reserveOut) = _token1 == _tokenIn
            ? (_reserve1, _reserve2)
            : (_reserve2, _reserve1);

        uint256 amountInWithFee = _amountIn * (10000 - _fee);
        uint256 numerator = (reserveOut * amountInWithFee);
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;

        amountOut = numerator / denominator;
    }

    function getReserves()
        public
        view
        returns (
            uint120 _reserve1,
            uint120 _reserve2,
            uint8 _fee
        )
    {
        _reserve1 = reserve1;
        _reserve2 = reserve2;
        _fee = fee;
    }

    function getTokens() public view returns (address _token1, address _token2) {
        _token1 = token1;
        _token2 = token2;
    }
}
