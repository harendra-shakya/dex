import { BigNumber, Contract, ContractFactory } from "ethers";

const { expect, assert } = require("chai");
const { ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

describe("dex tests", function () {
    const amount1 = ethers.utils.parseEther("1000");
    const amount2 = ethers.utils.parseEther("1784340");
    const smallAmount1 = ethers.utils.parseEther("10");
    const smallAmount2 = ethers.utils.parseEther("17843.4");
    let factory: Contract,
        wethToken: Contract,
        user: Contract,
        wethTokenAddress: string,
        daiTokenAddress: string,
        daiToken: Contract,
        user2: Contract,
        router: Contract,
        pool: Contract,
        usdcToken: Contract,
        wbtcToken: Contract;
    beforeEach(async function () {
        const accounts = await ethers.getSigners(2);
        user = accounts[0];
        user2 = accounts[1];
        const chainId = network.config.chainId;

        const wethTokenFactory: ContractFactory = await ethers.getContractFactory("WETH");
        wethToken = await wethTokenFactory.deploy();
        // prettier-ignore
        await wethToken.deployed();
        wethTokenAddress = wethToken.address;

        const daiTokenFactory: ContractFactory = await ethers.getContractFactory("DAI");
        daiToken = await daiTokenFactory.deploy();
        // prettier-ignore
        await daiToken.deployed();
        daiTokenAddress = daiToken.address;

        const usdcTokenFactory: ContractFactory = await ethers.getContractFactory("USDC");
        usdcToken = await usdcTokenFactory.deploy();
        // prettier-ignore
        await usdcToken.deployed();

        const wbtcTokenFactory: ContractFactory = await ethers.getContractFactory("WBTC");
        wbtcToken = await wbtcTokenFactory.deploy();
        // prettier-ignore
        await wbtcToken.deployed();

        const factoryContract: ContractFactory = await ethers.getContractFactory("Factory");
        factory = await factoryContract.deploy();
        // prettier-ignore
        await factory.deployed();

        const routerContract = await ethers.getContractFactory("Router");
        router = await routerContract.deploy(factory.address);
        // prettier-ignore
        await router.deployed();

        await wethToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
        await daiToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
        await usdcToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
        await router.addLiquidity(wethTokenAddress, daiTokenAddress, amount1, amount2, 30);
        const poolAddress: string = await factory.getPoolAddress(
            wethTokenAddress,
            daiTokenAddress,
            30
        );
        pool = await ethers.getContractAt("Pool", poolAddress);
        await pool.approve(router.address, ethers.utils.parseEther("10000000000000"));
    });

    describe("add liquidity", function () {
        it("calculates amount to be added", async function () {
            const beforeWethBal: BigNumber = await wethToken.balanceOf(pool.address);
            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                smallAmount1.add(smallAmount1), // doubling
                smallAmount2,
                30
            );
            const afterWethBal: BigNumber = await wethToken.balanceOf(pool.address);
            await expect(afterWethBal).to.equal(smallAmount1.add(beforeWethBal));

            const beforeDaiBal: BigNumber = await daiToken.balanceOf(pool.address);
            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                smallAmount1,
                smallAmount2.add(smallAmount2), // doubling
                30
            );
            const afterDaiBal: BigNumber = await daiToken.balanceOf(pool.address);
            await expect(afterDaiBal).to.equal(beforeDaiBal.add(smallAmount2));
        });
        it("sends liquidity tokens to provider", async function () {
            const bal: number = await pool.balanceOf(user.address);
            assert(bal > 0);
        });
    });
    describe("remove liquidity", function () {
        it("reverts if liquidity is 0 or pool doesn't exists", async function () {
            await expect(
                router.removeLiquidity(0, wethTokenAddress, daiTokenAddress, 30)
            ).to.be.revertedWith("ROUTER: Insufficient amount");

            await expect(
                router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 100)
            ).to.be.revertedWith("ROUTER: Pool doesn't exist");
        });
        it("removes liquidity and sends back assets", async function () {
            const liquidityBeforeBal: BigNumber = await pool.balanceOf(user.address);
            const wethBeforeBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiBeforeBal: BigNumber = await daiToken.balanceOf(user.address);

            await router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 30);
            const liquidityAfterBal: BigNumber = await pool.balanceOf(user.address);
            const wethAfterBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiAfterBal: BigNumber = await daiToken.balanceOf(user.address);

            await expect(liquidityBeforeBal).to.equal(liquidityAfterBal.add(smallAmount1));
            assert(wethAfterBal > wethBeforeBal);
            assert(daiAfterBal > daiBeforeBal);
        });
    });
    describe("swap", async function () {
        const swapAmount: BigNumber = ethers.utils.parseEther("1");
        it("swaps tokens", async function () {
            const wethBeforeBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiBeforeBal: BigNumber = await daiToken.balanceOf(user.address);

            const reserves = await pool.getReserves();

            const amountInWithFee: BigNumber = swapAmount.mul((10000 - 30).toString());
            const numerator: BigNumber = reserves._reserve2.mul(amountInWithFee);
            const denominator = reserves._reserve1.mul("10000").add(amountInWithFee);
            const amountOut: BigNumber = numerator.div(denominator);

            await router._swap(swapAmount, [wethTokenAddress, daiTokenAddress], user.address);
            const wethAfterBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiAfterBal: BigNumber = await daiToken.balanceOf(user.address);

            expect(wethBeforeBal).to.equal(wethAfterBal.add(swapAmount));
            expect(daiBeforeBal.add(amountOut)).to.equal(daiAfterBal);
        });
        it("swaps tokens even if particular pair not exists", async function () {
            await router.addLiquidity(daiTokenAddress, usdcToken.address, amount2, amount2, 30);

            const poolAddress = await factory.getPoolAddress(
                daiTokenAddress,
                usdcToken.address,
                30
            );
            const usdcPool = await ethers.getContractAt("Pool", poolAddress);

            const wethBeforeBal: BigNumber = await wethToken.balanceOf(user.address);
            const usdcBeforeBal: BigNumber = await usdcToken.balanceOf(user.address);

            const reserves = await pool.getReserves();
            const reserves2 = await usdcPool.getReserves();

            let amountInWithFee: BigNumber = swapAmount.mul((10000 - 30).toString());
            let numerator: BigNumber = reserves._reserve2.mul(amountInWithFee);
            let denominator: BigNumber = reserves._reserve1.mul("10000").add(amountInWithFee);
            let amountOut: BigNumber = numerator.div(denominator);

            amountInWithFee = amountOut.mul((10000 - 30).toString());
            numerator = reserves2._reserve2.mul(amountInWithFee);
            denominator = reserves2._reserve1.mul("10000").add(amountInWithFee);
            amountOut = numerator.div(denominator);

            await router._swap(
                swapAmount,
                [wethTokenAddress, daiTokenAddress, usdcToken.address], // we want weth --> usdc
                user.address
            );

            const wethAfterBal: BigNumber = await wethToken.balanceOf(user.address);
            const usdcAfterBal: BigNumber = await usdcToken.balanceOf(user.address);
            expect(wethBeforeBal).to.equal(wethAfterBal.add(swapAmount));
            expect(usdcBeforeBal.add(amountOut)).to.equal(usdcAfterBal);
        });
    });
});
