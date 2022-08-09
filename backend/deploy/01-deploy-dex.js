const { network } = require("hardhat");
const {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts();
    const { log, deploy } = deployments;
    const waitConfirmations = !developmentChains.includes(network.name)
        ? VERIFICATION_BLOCK_CONFIRMATIONS
        : 1;

    log("-----------------------------------------------------------");
    log("deploying factory......");

    const factory = await deploy("Factory", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    log("-----------------------------------------------------------");
    log("Deploying Router....");

    const router = await deploy("Router", {
        from: deployer,
        log: true,
        args: [factory.address],
        waitConfirmations: waitConfirmations,
    });

    log("-----------------------------------------------------------");
    log("Deploying liquidity token....");

    const token = await deploy("LiquidityToken", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    if (!developmentChains.includes(network.name)) {
        await verify(factory.address, args);
        await verify(router.address, [factory.address]);
        await verify(token.address, []);
    }
};
