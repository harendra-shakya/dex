const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

describe("smart contract tests", function () {
    const amount1 = ethers.utils.parseEther("100");
    const amount2 = ethers.utils.parseEther("165400");
    let factory,
        wethToken,
        user,
        wethTokenAddress,
        daiTokenAddress,
        daiToken,
        user2,
        library,
        router;
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

        const libraryContact = await ethers.getContractFactory("HelperLibrary");
        library = await libraryContact.deploy();
        // prettier-ignore
        await library.deployed({ "from": user });

        const factoryContract = await ethers.getContractFactory("Factory");
        factory = await factoryContract.deploy(
            [wethTokenAddress, daiTokenAddress],
            [networkConfig[chainId]["ethUsdPriceFeed"], networkConfig[chainId]["daiUsdPriceFeed"]]
        );
        // prettier-ignore
        await factory.deployed({ "from": user });

        const routerContract = await ethers.getContractFactory("Router");
        router = await routerContract.deploy(factory.address);
        // prettier-ignore
        await router.deployed({ "from": user });
    });

    describe("dex unit test", function () {
        beforeEach(async function () {
            await wethToken.approve(router.address, ethers.utils.parseEther("1000000000000000"));
            await daiToken.approve(router.address, ethers.utils.parseEther("1000000000000000000"));
            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                amount1, // amount that liquidity provider want to add
                amount2,
                10, // min amount
                10, // i think use it on slipage
                30
            );
        });
        describe("add liquidity", function () {});
        describe("swap", function () {
            it("calculates tokens to be sent", async function () {
                const poolAddress = await factory.getPoolAddress(
                    wethTokenAddress,
                    daiTokenAddress,
                    30
                );
                const pool = await ethers.getContractAt("Pool", poolAddress);
                // const r1 = await pool.getReserves();
                // console.log(r1._reserve1);
                // console.log(ethers.utils.formatEther(r1._reserve2));
                // const p1 = await pool.getLatestPrice(wethTokenAddress);
                // const p2 = await pool.getLatestPrice(daiTokenAddress);
                // // await pool.addLiquidity(wethTokenAddress, amount1, daiTokenAddress, amount2);
                // console.log("weth price", ethers.utils.formatUnits(parseInt(p1.toString()), "8"));
                // console.log("dai price", ethers.utils.formatUnits(parseInt(p2.toString()), "8"));
                let amt = await pool.getAmountOut(
                    daiTokenAddress,
                    ethers.utils.parseEther("1681.52085106")
                );
                // console.log("amountOut", ethers.utils.formatEther(amt.amountOut));
                // console.log("amountOut", ethers.utils.formatEther(amt._reserveIn));
                // console.log("amountOut", ethers.utils.formatEther(amt._reserveOut));
            });
        });
    });
});
