import { ethers } from "hardhat";
import * as fs from "fs";
import { Contract } from "ethers";

export default async function () {
    await updateAbi();
    await updateContractAddresses();
}

const abiPath = "../../frontend/constants/";
const mappingPath = "../../frontend/constants/networkMapping.json";

const updateAbi = async () => {
    const factory = await ethers.getContract("Factory");
    const router = await ethers.getContract("Router");
    const token = await ethers.getContract("LiquidityToken");
    const strings = ["Factory.json", "Router.json", "LiquidityToken.json"];
    const contracts = [factory, router, token];
    type interfaceType = {
        aniPath: string;
        inter: string | string[];
    };

    for (let i = 0; i < strings.length; i++) {
        const inter = contracts[i].interface.format(ethers.utils.FormatTypes.json);
        fs.writeFileSync(abiPath + strings[i], inter);
    }
};

const updateContractAddresses = async () => {
    const factory = await ethers.getContract("Factory");
    const router = await ethers.getContract("Router");
    const token = await ethers.getContract("LiquidityToken");
};
