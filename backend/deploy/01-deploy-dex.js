const { network } = require("hardhat");
const {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
} = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts();
    const { log, deploy } = deployments;
    const waitConfirmations = !developmentChains.includes(network.name)
        ? VERIFICATION_BLOCK_CONFIRMATIONS
        : 1;

    const chainId = network.config.chainId;

    const args = [
        networkConfig[chainId]["tokenAddresses"],
        [
            networkConfig[chainId]["btcUsdPriceFeed"],
            networkConfig[chainId]["ethUsdPriceFeed"],
            networkConfig[chainId]["daiUsdPriceFeed"],
            networkConfig[chainId]["usdcUsdPriceFeed"],
            networkConfig[chainId]["anonimUsdPriceFeed"],
        ],
    ];

    log("-----------------------------------------------------------");
    log("deploying......");

    const dex = await deploy("Dex", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: waitConfirmations,
    });

    log("Deployed Dex!");
};
