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

    if (!developmentChains.includes(network.name)) {
        await verify(factory.address, []);
        await verify(router.address, [factory.address]);
    }
};

export default deployFunction;
deployFunction.tags = ["all", "main"];
