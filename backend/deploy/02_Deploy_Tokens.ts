import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";
import {
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

    await deploy("WETH", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    log("-----------------------------------------------------------");
    log("Deploying Router....");

    await deploy("WBTC", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    log("-----------------------------------------------------------");
    log("Deploying liquidity token....");

    await deploy("USDC", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    await deploy("DAI", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });
};

export default deployFunction;
deployFunction.tags = ["all", "tokens"];
