import { DeployFunction } from "hardhat-deploy/types";
import { ethers, network } from "hardhat";
import * as fs from "fs";

const deployFunction: DeployFunction = async () => {
    await updateAbi();
    await updateAddresses();
};

const abiPath = "../frontend/constants/";
const mappingPath = "../frontend/constants/networkMapping.json";

const updateAbi = async () => {
    const factory = await ethers.getContract("Factory");
    const router = await ethers.getContract("Router");
    const strings = ["Factory.json", "Router.json"];
    const contracts = [factory, router];

    for (let i = 0; i < strings.length; i++) {
        let _interface: string | NodeJS.ArrayBufferView = contracts[i].interface.format(
            ethers.utils.FormatTypes.json
        ) as string | NodeJS.ArrayBufferView;

        fs.writeFileSync(abiPath + strings[i], _interface);
    }
};

const updateAddresses = async () => {
    const factory = await ethers.getContract("Factory");
    const router = await ethers.getContract("Router");
    const weth = await ethers.getContract("WETH");
    const usdc = await ethers.getContract("USDC");
    const wbtc = await ethers.getContract("WBTC");
    const dai = await ethers.getContract("DAI");
    const contractAddresses = await JSON.parse(fs.readFileSync(mappingPath, "utf8"));
    const chainId = await network.config.chainId?.toString();

    const strings = ["Factory", "Router", "WETH", "USDC", "WBTC", "DAI"];
    const addresses = [
        factory.address,
        router.address,
        weth.address,
        usdc.address,
        wbtc.address,
        dai.address,
    ];

    for (let i = 0; i < strings.length; i++) {
        if (chainId! in contractAddresses) {
            if (!contractAddresses[chainId!][strings[i]]) {
                contractAddresses[chainId!][strings[i]] = [addresses[i]];
            }
        } else {
            contractAddresses[chainId!] = { [strings[i]]: [addresses[i]] };
        }
    }

    fs.writeFileSync(mappingPath, JSON.stringify(contractAddresses));
};

export default deployFunction;
deployFunction.tags = ["all", "frontend"];
