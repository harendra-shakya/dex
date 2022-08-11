import { BigNumber, Contract, ContractFactory } from "ethers";

import { expect, assert } from "chai";
const { ethers, network } = require("hardhat");

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
        it("reverts if max fee amounts exceeds", async function () {
            await expect(
                router.addLiquidity(
                    wethTokenAddress,
                    daiTokenAddress,
                    smallAmount1,
                    smallAmount2,
                    101
                )
            ).to.be.revertedWith("ROUTER: MAX_FEE_AMOUNT_IS_1%");
        });
        it("reverts if anyone amount is zero", async function () {
            await expect(
                router.addLiquidity(wethTokenAddress, daiTokenAddress, 0, smallAmount2, 30)
            ).to.be.revertedWith("ROUTER: INVALID_AMOUNT");

            await expect(
                router.addLiquidity(wethTokenAddress, daiTokenAddress, smallAmount1, 0, 30)
            ).to.be.revertedWith("ROUTER: INVALID_AMOUNT");
        });
        it("calculates amount to be added", async function () {
            const beforeWethBal: BigNumber = await wethToken.balanceOf(pool.address);
            const beforeDaiBal: BigNumber = await daiToken.balanceOf(pool.address);

            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                smallAmount1.add(smallAmount1), // doubling
                smallAmount2,
                30
            );
            const afterWethBal: BigNumber = await wethToken.balanceOf(pool.address);
            const afterDaiBal: BigNumber = await daiToken.balanceOf(pool.address);

            expect(afterWethBal).to.equal(smallAmount1.add(beforeWethBal));
            expect(afterDaiBal).to.equal(smallAmount2.add(beforeDaiBal));
        });
        it("transfer token to pool from provider", async function () {
            const beforePoolWethBal: BigNumber = await wethToken.balanceOf(pool.address);
            const beforeProviderWethBal: BigNumber = await wethToken.balanceOf(user.address);
            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                smallAmount1,
                smallAmount2,
                30
            );
            const afterPoolWethBal: BigNumber = await wethToken.balanceOf(pool.address);
            const afterProviderWethBal: BigNumber = await wethToken.balanceOf(user.address);
            expect(afterPoolWethBal).to.equal(smallAmount1.add(beforePoolWethBal));
            expect(beforeProviderWethBal).to.equal(smallAmount1.add(afterProviderWethBal));
        });
        it("sends liquidity tokens to provider", async function () {
            const beforeBal: BigNumber = await pool.balanceOf(user.address);
            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                smallAmount1,
                smallAmount2,
                30
            );
            const afterBal: BigNumber = await pool.balanceOf(user.address);

            assert(afterBal > beforeBal);
        });
        it("updates reserves", async function () {
            let reserves = await pool.getReserves();
            const beforeR1: BigNumber = reserves._reserve1;
            const beforeR2: BigNumber = reserves._reserve2;

            await router.addLiquidity(
                wethTokenAddress,
                daiTokenAddress,
                smallAmount1,
                smallAmount2,
                30
            );
            reserves = await pool.getReserves();

            const afterR1: BigNumber = reserves._reserve1;
            const afterR2: BigNumber = reserves._reserve2;
            assert(afterR1 > beforeR1);
            assert(afterR2 > beforeR2);
            expect(afterR1).to.equal(beforeR1.add(smallAmount1));
            expect(afterR2).to.equal(beforeR2.add(smallAmount2));
        });
        it("emits pool's Mint event", async function () {
            await expect(
                router.addLiquidity(
                    wethTokenAddress,
                    daiTokenAddress,
                    smallAmount1,
                    smallAmount2,
                    30
                )
            ).to.emit(pool, "Mint");
        });
    });
    describe("remove liquidity", function () {
        it("reverts if liquidity we are sending 0 liquidity", async function () {
            await expect(
                router.removeLiquidity(0, wethTokenAddress, daiTokenAddress, 30)
            ).to.be.revertedWith("ROUTER: Insufficient amount");
        });
        it("reverts if asking to remove liquidity from a unknown pool", async function () {
            await expect(
                router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 100)
            ).to.be.revertedWith("ROUTER: Pool doesn't exist");
        });
        it("reverts if asking for more liquidity than in pool", async function () {
            await expect(
                router.removeLiquidity(amount2, wethTokenAddress, daiTokenAddress, 30)
            ).to.be.revertedWith("ROUTER: Insufficient liquidity");
        });
        it("takes liquidity token from provider and burn them", async function () {
            const liquidityBeforeBal: BigNumber = await pool.balanceOf(user.address);
            await router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 30);
            const liquidityAfterBal: BigNumber = await pool.balanceOf(user.address);
            expect(liquidityBeforeBal).to.equal(liquidityAfterBal.add(smallAmount1));
        });
        it("sends back assets", async function () {
            const wethBeforeBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiBeforeBal: BigNumber = await daiToken.balanceOf(user.address);

            await router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 30);
            const wethAfterBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiAfterBal: BigNumber = await daiToken.balanceOf(user.address);

            assert(wethAfterBal > wethBeforeBal);
            assert(daiAfterBal > daiBeforeBal);
        });
        it("updates reserves after sending back assets", async function () {
            let reserves: {
                _reserve1: BigNumber;
                _reserve2: BigNumber;
            } = await pool.getReserves();

            const beforeR1: BigNumber = reserves._reserve1;
            const beforeR2: BigNumber = reserves._reserve2;
            const totalSupply: BigNumber = await pool.totalSupply();
            const asset1Amount: BigNumber = amount1.mul(beforeR1).div(totalSupply);
            const asset2Amount: BigNumber = amount1.mul(beforeR2).div(totalSupply);

            await router.removeLiquidity(amount1, wethTokenAddress, daiTokenAddress, 30);
            reserves = await pool.getReserves();

            const afterR1: BigNumber = reserves._reserve1;
            const afterR2: BigNumber = reserves._reserve2;

            expect(beforeR1).to.equal(afterR1.add(asset1Amount));
            expect(beforeR2).to.equal(afterR2.add(asset2Amount));
        });
        it("emits pool's Burn event", async function () {
            await expect(
                router.removeLiquidity(amount1, wethTokenAddress, daiTokenAddress, 30)
            ).to.emit(pool, "Burn");
        });
    });
    describe("swap", async function () {
        const swapAmount: BigNumber = ethers.utils.parseEther("1");
        it("reverts if path length is less than 2", async function () {
            await expect(
                router._swap(swapAmount, [wethTokenAddress], user.address)
            ).to.be.revertedWith("ROUTER: INVALID_PATH");
        });
        it("swaps tokens", async function () {
            const wethBeforeBal: BigNumber = await wethToken.balanceOf(user.address);
            const daiBeforeBal: BigNumber = await daiToken.balanceOf(user.address);

            const reserves: {
                _reserve1: BigNumber;
                _reserve2: BigNumber;
            } = await pool.getReserves();

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

            const reserves: {
                _reserve1: BigNumber;
                _reserve2: BigNumber;
            } = await pool.getReserves();

            const reserves2: {
                _reserve1: BigNumber;
                _reserve2: BigNumber;
            } = await usdcPool.getReserves();

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
        it("updates reserves", async function () {
            let reserves: {
                _reserve1: BigNumber;
                _reserve2: BigNumber;
            } = await pool.getReserves();

            const beforeR1: BigNumber = reserves._reserve1;
            const beforeR2: BigNumber = reserves._reserve2;

            const amountInWithFee: BigNumber = swapAmount.mul((10000 - 30).toString());
            const numerator: BigNumber = reserves._reserve2.mul(amountInWithFee);
            const denominator: BigNumber = reserves._reserve1.mul("10000").add(amountInWithFee);
            const amountOut: BigNumber = numerator.div(denominator);

            await router._swap(swapAmount, [wethTokenAddress, daiTokenAddress], user.address);
            reserves = await pool.getReserves();

            const afterR1: BigNumber = reserves._reserve1;
            const afterR2: BigNumber = reserves._reserve2;

            assert(beforeR1 < afterR1);
            assert(beforeR2 > afterR2);
            expect(afterR1).to.equal(beforeR1.add(swapAmount));
            expect(beforeR2).to.equal(afterR2.add(amountOut));
        });
        it("emits pool's Swap event", async function () {
            await expect(
                router._swap(swapAmount, [wethTokenAddress, daiTokenAddress], user.address)
            ).to.emit(pool, "Swap");
        });
    });
});
