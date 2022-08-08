const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

describe("dex tests", function () {
    const amount1 = ethers.utils.parseEther("1000");
    const amount2 = ethers.utils.parseEther("1784340");
    const smallAmount1 = ethers.utils.parseEther("10");
    const smallAmount2 = ethers.utils.parseEther("17843.4");
    let factory,
        wethToken,
        user,
        wethTokenAddress,
        daiTokenAddress,
        daiToken,
        user2,
        library,
        router,
        pool,
        usdcToken,
        wbtcToken;
    beforeEach(async function () {
        const accounts = await ethers.getSigners(2);
        user = accounts[0];
        user2 = accounts[1];
        const chainId = network.config.chainId;

        const wethTokenFactory = await ethers.getContractFactory("WETH");
        wethToken = await wethTokenFactory.deploy();
        // prettier-ignore
        await wethToken.deployed({ "from": user });
        wethTokenAddress = wethToken.address;

        const daiTokenFactory = await ethers.getContractFactory("DAI");
        daiToken = await daiTokenFactory.deploy();
        // prettier-ignore
        await daiToken.deployed({ "from": user });
        daiTokenAddress = daiToken.address;

        const usdcTokenFactory = await ethers.getContractFactory("USDC");
        usdcToken = await usdcTokenFactory.deploy();
        // prettier-ignore
        await usdcToken.deployed({ "from": user });

        const wbtcTokenFactory = await ethers.getContractFactory("WBTC");
        wbtcToken = await wbtcTokenFactory.deploy();
        // prettier-ignore
        await wbtcToken.deployed({ "from": user });

        const libraryContact = await ethers.getContractFactory("HelperLibrary");
        library = await libraryContact.deploy();
        // prettier-ignore
        await library.deployed({ "from": user });

        const factoryContract = await ethers.getContractFactory("Factory");
        factory = await factoryContract.deploy();
        // prettier-ignore
        await factory.deployed({ "from": user });

        const routerContract = await ethers.getContractFactory("Router");
        router = await routerContract.deploy(factory.address);
        // prettier-ignore
        await router.deployed({ "from": user });

        await wethToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
        await daiToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
        await usdcToken.approve(router.address, ethers.utils.parseEther("10000000000000"));
        await router.addLiquidity(wethTokenAddress, daiTokenAddress, amount1, amount2, 30);
        const poolAddress = await factory.getPoolAddress(wethTokenAddress, daiTokenAddress, 30);
        pool = await ethers.getContractAt("Pool", poolAddress);
        await pool.approve(router.address, ethers.utils.parseEther("10000000000000"));
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
        it("reverts if liquidity is 0 or pool doesn't exists", async function () {
            await expect(
                router.removeLiquidity(0, wethTokenAddress, daiTokenAddress, 30)
            ).to.be.revertedWith("ROUTER: Insufficient amount");

            await expect(
                router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 100)
            ).to.be.revertedWith("ROUTER: Pool doesn't exist");
        });
        it("removes liquidity and sends back liuidity", async function () {
            const liquidityBeforeBal = await pool.balanceOf(user.address);
            const wethBeforeBal = await wethToken.balanceOf(user.address);
            const daiBeforeBal = await daiToken.balanceOf(user.address);
            // console.log("wethBeforeBal", ethers.utils.formatEther(wethBeforeBal));
            await router.removeLiquidity(smallAmount1, wethTokenAddress, daiTokenAddress, 30);
            const liquidityAfterBal = await pool.balanceOf(user.address);
            const wethAfterBal = await wethToken.balanceOf(user.address);
            const daiAfterBal = await daiToken.balanceOf(user.address);

            const poolBal = await pool.balanceOf(pool.address);
            // console.log("daiBeforeBal", ethers.utils.formatEther(daiBeforeBal));
            // console.log("wethAfterBal", ethers.utils.formatEther(wethAfterBal));
            // console.log("daiAfterBal", ethers.utils.formatEther(daiAfterBal));
            const totalSupply = await pool.totalSupply();
            const reserves = await pool.getReserves();

            await expect(liquidityBeforeBal).to.equal(liquidityAfterBal.add(smallAmount1));
            assert(wethAfterBal > wethBeforeBal);
            assert(daiAfterBal > daiBeforeBal);
        });
    });
    describe("swap", async function () {
        const swapAmount = ethers.utils.parseEther("1");
        it("swaps tokens", async function () {
            // const liquidityBeforeBal = await pool.balanceOf(user.address);
            const wethBeforeBal = await wethToken.balanceOf(user.address);
            const daiBeforeBal = await daiToken.balanceOf(user.address);
            // console.log("wethBeforeBal", ethers.utils.formatEther(wethBeforeBal));
            // const totalSupply = await pool.totalSupply();
            const reserves = await pool.getReserves();

            const amountInWithFee = swapAmount.mul((10000 - 30).toString());
            const numerator = reserves._reserve2.mul(amountInWithFee);
            const denominator = reserves._reserve1.mul("10000").add(amountInWithFee);
            const amountOut = numerator.div(denominator);

            await router._swap(swapAmount, [wethTokenAddress, daiTokenAddress], user.address);
            const wethAfterBal = await wethToken.balanceOf(user.address);
            const daiAfterBal = await daiToken.balanceOf(user.address);
            // const txReceipt = await tx.wait(1);
            // const gas = txReceipt.cumulativeGasUsed.mul(txReceipt.effectiveGasPrice);
            // const liquidityAfterBal = await pool.balanceOf(user.address);

            // const poolBal = await pool.balanceOf(pool.address);
            // console.log("wethAfterBal", ethers.utils.formatEther(wethAfterBal));

            // console.log("      daiBeforeBal", ethers.utils.formatEther(daiBeforeBal));
            // console.log("       daiAfterBal", ethers.utils.formatEther(daiAfterBal));
            // console.log(
            //     "expected amountOut",
            //     ethers.utils.formatEther(daiAfterBal.sub(daiBeforeBal))
            // );
            // console.log("  actual amountOut", ethers.utils.formatEther(amountOut));

            // console.log(
            //     "totaldaiBeforeBal",
            //     ethers.utils.formatEther(daiBeforeBal.add(amountOut))
            // );

            expect(wethBeforeBal).to.equal(wethAfterBal.add(swapAmount));
            expect(daiBeforeBal.add(amountOut)).to.equal(daiAfterBal);
        });
        it("swaps tokens even if particular pair not exists", async function () {
            await router.addLiquidity(daiTokenAddress, usdcToken.address, amount2, amount2, 30);
            // await router.addLiquidity(wethToken.address, usdcToken.address, amount1, amount2, 30);

            const poolAddress = await factory.getPoolAddress(
                daiTokenAddress,
                usdcToken.address,
                30
            );
            const usdcPool = await ethers.getContractAt("Pool", poolAddress);

            const wethBeforeBal = await wethToken.balanceOf(user.address);
            const usdcBeforeBal = await usdcToken.balanceOf(user.address);
            // console.log("wethBeforeBal", ethers.utils.formatEther(wethBeforeBal));
            // const totalSupply = await pool.totalSupply();
            const reserves = await pool.getReserves();
            const reserves2 = await usdcPool.getReserves();

            let amountInWithFee = swapAmount.mul((10000 - 30).toString());
            let numerator = reserves._reserve2.mul(amountInWithFee);
            let denominator = reserves._reserve1.mul("10000").add(amountInWithFee);
            let amountOut = numerator.div(denominator);

            amountInWithFee = amountOut.mul((10000 - 30).toString());
            numerator = reserves2._reserve2.mul(amountInWithFee);
            denominator = reserves2._reserve1.mul("10000").add(amountInWithFee);
            amountOut = numerator.div(denominator);

            // numerator = reserves2._reserve2.mul(amountInWithFee);
            // denominator = reserves2._reserve1.mul("10000").add(amountInWithFee);
            // const amountOut2 = numerator.div(denominator);

            await router._swap(
                swapAmount,
                [wethTokenAddress, daiTokenAddress, usdcToken.address], // we want weth --> usdc
                user.address
            );

            const wethAfterBal = await wethToken.balanceOf(user.address);
            const usdcAfterBal = await usdcToken.balanceOf(user.address);
            // const txReceipt = await tx.wait(1);
            // const gas = txReceipt.cumulativeGasUsed.mul(txReceipt.effectiveGasPrice);
            // const liquidityAfterBal = await pool.balanceOf(user.address);

            // const poolBal = await pool.balanceOf(pool.address);
            // console.log("wethAfterBal", ethers.utils.formatEther(wethAfterBal));

            console.log("      usdcBeforeBal", ethers.utils.formatEther(usdcBeforeBal));
            console.log("       usdcAfterBal", ethers.utils.formatEther(usdcAfterBal));
            console.log("expected amountOut", ethers.utils.formatEther(amountOut));

            console.log(
                "  actual amountOut",
                ethers.utils.formatEther(usdcAfterBal.sub(usdcBeforeBal))
            );

            console.log(
                "totalusdcBeforeBal",
                ethers.utils.formatEther(usdcBeforeBal.add(amountOut))
            );

            expect(wethBeforeBal).to.equal(wethAfterBal.add(swapAmount));
            expect(usdcBeforeBal.add(amountOut)).to.equal(usdcAfterBal);
        });
    });
});
