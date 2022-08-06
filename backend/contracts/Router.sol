// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Factory.sol";
import "./Pool.sol";
import "./libraries/HelperLibrary.sol";

// TODO: Make interfaces

pragma solidity ^0.8.7;

contract Router is ReentrancyGuard {
    bytes4 private constant T_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 private constant TF_SELECTOR =
        bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));

    mapping(address => AggregatorV3Interface) s_priceFeeds;
    mapping(address => mapping(address => uint256)) s_liquidity;
    mapping(address => uint256) s_totalLiquidity;

    ////////////////////////
    ////   Events   ///////
    //////////////////////

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

        (uint256 price1, uint256 decimals1) = getLatestPrice(_token1);
        (uint256 price2, uint256 decimals2) = getLatestPrice(_token2);

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
        isAmountEqual(_token1, _amount1, _token2, _amount2);
        address _pool = Factory(factory).getPoolAddress(_token1, _token2);
        HelperLibrary._safeTranferFrom(_token1, msg.sender, _pool, _amount1);
        HelperLibrary._safeTranferFrom(_token2, msg.sender, _pool, _amount2);

        Pool(_pool).mint(msg.sender);

        emit LiquidityAdded(_token1, _amount1, _token2, _amount2);
    }

    // *** Remove Liquidity ***
    function removeLiquidity(
        uint256 _amount,
        address _token1,
        address _token2
    ) external nonReentrant {
        require(_amount > 0, "Amount is equal to zero");
        require(_token1 != _token2, "Same token not allowed");
        address _pool = Factory(factory).getPoolAddress(_token1, _token2);
        HelperLibrary._safeTranferFrom(_pool, msg.sender, _pool, _amount);
        // emit LiquidityRemoved(_token1, _amount1, _token2, _amount2);
        Pool(_pool).burn(msg.sender);
        emit LiquidityRemoved(_token1, _token2, _amount);
    }

    // *** Swap *** //
    function _swap(
        uint256 _amountIn,
        address[] memory _path, // path[0] -> tokenIn // path[last] -> tokenOut
        address _to
    ) external nonReentrant {
        HelperLibrary._safeTranferFrom(_path[0], msg.sender, address(this), _amountIn);
        for (uint256 i = 0; i < _path.length; i++) {
            address _pool = Factory(factory).getPoolAddress(_path[i], _path[i + 1]);
            uint256 _amountOut1 = Pool(_pool).getAmountOut(_path[i], _amountIn, _path[i + 1]);
            uint256 _amountOut2 = Pool(_pool).getAmountOut(_path[i + 1], _amountIn, _path[i + 2]);

            (uint256 amountOut1, uint256 amountOut2) = i == 0
                ? (_amountOut1, _amountOut2)
                : (uint256(0), _amountOut2);
            address to = i < _path.length - 2 ? address(this) : _to;

            Pool(_pool).swap(amountOut1, amountOut2, to);
        }
    }

    function getLatestPrice(address _token) public view returns (uint256, uint256) {
        (, int256 price, , , ) = s_priceFeeds[_token].latestRoundData();
        uint256 decimals = uint256(s_priceFeeds[_token].decimals());
        return (uint256(price), decimals);
    }
}
