const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

describe("smart contract tests", function () {
    const amount1 = ethers.utils.parseEther("1");
    const amount2 = ethers.utils.parseEther("1667.37451386");
    let dex, pool, wethToken, user, wethTokenAddress, daiTokenAddress, daiToken, user2;
    beforeEach(async function () {
        const accounts = await ethers.getSigners(2);
        user = accounts[0];
        user2 = accounts[1];
        const chainId = network.config.chainId;

        const wethTokenContract = await ethers.getContractFactory("WETH");
        wethToken = await wethTokenContract.deploy();
        // prettier-ignore
        await wethToken.deployed({ "from": user });
        wethTokenAddress = wethToken.address;

        const daiTokenContract = await ethers.getContractFactory("DAI");
        daiToken = await daiTokenContract.deploy();
        // prettier-ignore
        await daiToken.deployed({ "from": user });
        daiTokenAddress = daiToken.address;

        const contract = await ethers.getContractFactory("Dex");
        dex = await contract.deploy(
            [wethTokenAddress, daiTokenAddress],
            [networkConfig[chainId]["ethUsdPriceFeed"], networkConfig[chainId]["daiUsdPriceFeed"]]
        );
        // prettier-ignore
        await dex.deployed({ "from": user });
    });

    /////////////////////////
    /////   Dex test   //////
    ////////////////////////

    describe("dex unit tests", function () {});

    ////////////////////////
    /////  Pool test //////
    //////////////////////

    describe("pool unit test", function () {
        beforeEach(async function () {});
        describe("swap", function () {
            it("calculates tokens to be sent", async function () {
                await dex.createPool(wethTokenAddress, amount1, daiTokenAddress, amount2, 3);
                const poolAddress = await dex.getPoolAddress(wethTokenAddress, daiTokenAddress);
                const pool = await ethers.getContractAt("Pool", poolAddress);
                const p1 = await pool.getLatestPrice(wethTokenAddress);
                const p2 = await pool.getLatestPrice(daiTokenAddress);
                await wethToken.approve(poolAddress, ethers.utils.parseEther("100"));
                await daiToken.approve(poolAddress, ethers.utils.parseEther("1000000000000"));
                await pool.addLiquidity(wethTokenAddress, amount1, daiTokenAddress, amount2);
                console.log(ethers.utils.formatUnits(parseInt(p1.toString()), "8"));
                console.log(ethers.utils.formatUnits(parseInt(p2.toString()), "8"));
                await pool.getAmount(
                    wethTokenAddress,
                    ethers.utils.parseEther("0.3"),
                    daiTokenAddress
                );
                const amt = await pool.getAmount(
                    daiTokenAddress,
                    ethers.utils.parseEther("100"),
                    wethTokenAddress
                );

                console.log("amt", ethers.utils.formatEther(amt));
            });
        });
    });
});
