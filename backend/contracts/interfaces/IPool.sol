// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

interface IPool {
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function PERMIT_TYPEHASH() external pure returns (bytes32);

    function nonces(address owner) external view returns (uint256);

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

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

    function getReserves()
        external
        view
        returns (
            uint120 _reserve1,
            uint120 _reserve2,
            uint8 _fee
        );

    function mint(address _to) external returns (uint256 liquidity);

    function burn(address _to) external returns (uint256 amount1, uint256 amount2);

    function swap(
        uint256 _amountOut1,
        uint256 _amountOut2,
        address _to
    ) external returns (uint256 amountOut);

    function getLatestPrice(address _token) external view returns (uint256, uint256);

    function getTokens() external view returns (address _token1, address _token2);

    function getAmountOut(address _tokenIn, uint256 _amountIn)
        external
        view
        returns (uint256 amountOut);
}
