import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";
import {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const deployFunction: DeployFunction = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;

    const { deployer } = await getNamedAccounts();
    const chainId: number | undefined = network.config.chainId;
    if (!chainId) return;

    const waitConfirmations: number = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS;

    log("-----------------------------------------------------------");
    log("deploying factory......");

    const weth = await deploy("WETH", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    log("-----------------------------------------------------------");
    log("Deploying Router....");

    const wbtc = await deploy("WBTC", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    log("-----------------------------------------------------------");
    log("Deploying liquidity token....");

    const usdc = await deploy("USDC", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    const dai = await deploy("DAI", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });
};

export default deployFunction;
deployFunction.tags = ["all", "tokens"];
