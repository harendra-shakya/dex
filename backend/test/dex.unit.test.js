const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

describe("smart contract tests", function () {
    const amount1 = ethers.utils.parseEther("1000");
    const amount2 = ethers.utils.parseEther("1654000");
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
        const smallAmount1 = ethers.utils.parseEther("10");
        const smallAmount2 = ethers.utils.parseEther("16540");
        let pool;
        beforeEach(async function () {
            await wethToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
            await daiToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
            await router.addLiquidity(wethTokenAddress, daiTokenAddress, amount1, amount2, 30);
            const poolAddress = await factory.getPoolAddress(
                wethTokenAddress,
                daiTokenAddress,
                30
            );
            pool = await ethers.getContractAt("Pool", poolAddress);
        });
        describe("add liquidity", function () {
            it("optimizes amount automatically", async function () {
                const beforeWethBal = await wethToken.balanceOf(pool.address);
                await router.addLiquidity(
                    wethTokenAddress,
                    daiTokenAddress,
                    smallAmount1.add(smallAmount1), // doubling
                    smallAmount2,
                    30
                );
                const afterWethBal = await wethToken.balanceOf(pool.address);
                await expect(afterWethBal).to.equal(smallAmount1.add(beforeWethBal));

                const beforeDaiBal = await daiToken.balanceOf(pool.address);
                await router.addLiquidity(
                    wethTokenAddress,
                    daiTokenAddress,
                    smallAmount1,
                    smallAmount2.add(smallAmount2), // doubling
                    30
                );
                const afterDaiBal = await daiToken.balanceOf(pool.address);
                await expect(afterDaiBal).to.equal(beforeDaiBal.add(smallAmount2));
            });
            it("sends liquidity tokens to provider", async function () {
                const bal = await pool.balanceOf(user.address);
                assert(bal > 0);
            });
        });
        describe("remove liquidity", function () {
            it("");
        });
    });
});
