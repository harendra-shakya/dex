import { useEffect, useState } from "react";
import { Modal, useNotification, Input, Select } from "@web3uikit/core";
import { useMoralis } from "react-moralis";
import { ethers, Contract } from "ethers";
import { OptionProps } from "@web3uikit/core";
import contractAddresses from "../constants/networkMapping.json";
import routerAbi from "../constants/Router.json";
import tokenAbi from "../constants/Token.json";
import poolAbi from "../constants/Pool.json";
import factoryAbi from "../constants/Factory.json";

type RemoveLiquidityModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

export default function RemoveLiquidityModal({ isVisible, onClose }: RemoveLiquidityModalProps) {
    const { isWeb3Enabled, account, chainId } = useMoralis();
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [amount1, setAmount1] = useState("");
    const [amount2, setAmount2] = useState("");
    const [token1Liquidity, setToken1Liquidity] = useState(0);
    const [token2Liquidity, setToken2Liquidity] = useState(0);
    const [OptionProps, setOptionProps] = useState<OptionProps[]>();
    const [token1, setToken1] = useState("WETH");
    const [token1Supply, setToken1Supply] = useState("");
    const [token2Supply, setToken2Supply] = useState("");
    const [token2, setToken2] = useState("DAI");
    const [fee, setFee] = useState("0.3");
    const [input2Disabled, setInput2Disabled] = useState(true);
    const dispatch = useNotification();

    const allTokens = ["WETH", "WBTC", "DAI", "USDC"];

    async function updateOptions() {
        let _data: OptionProps[] = [];
        allTokens.forEach(async (token, i) => {
            _data.push({
                id: token,
                label: token,
            });
        });
        setOptionProps(_data);
    }

    const updateAmount2 = async () => {
        try {
            setInput2Disabled(true);
            if (token1 === token2) {
                setAmount2("Why are you choosing same token kid?");
                return;
            }
            setIsOkDisabled(true);
            const { ethereum } = window;
            const provider = await new ethers.providers.Web3Provider(ethereum!);
            const address0 = "0x0000000000000000000000000000000000000000";
            const signer = provider.getSigner();
            const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";
            const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];
            const factory: Contract = await new ethers.Contract(
                factoryAddress,
                factoryAbi,
                signer
            );

            type Token = "WETH" | "DAI" | "WBTC" | "USDC";
            const _token1: Token = token1 as Token;
            const _token2: Token = token2 as Token;
            const token1Addr: string = contractAddresses[_chainId][_token1][0];
            const token2Addr: string = contractAddresses[_chainId][_token2][0];

            const _fee = parseFloat(fee) * 100;
            const poolAddr = await factory.getPoolAddress(token1Addr, token2Addr, _fee);

            if (poolAddr === address0) {
                setIsOkDisabled(false);
                setAmount1("0");
                setAmount2("No pool exists!");
                return;
            }

            const pool = await new ethers.Contract(poolAddr, poolAbi, signer);

            const amountOut = await pool.getAmountOut(
                token1Addr,
                ethers.utils.parseEther(amount1)
            );

            setAmount2(ethers.utils.formatEther(amountOut!));
            setIsOkDisabled(false);
        } catch (e) {
            setIsOkDisabled(false);
            console.log(e);
        }
    };

    const showTokenSupply = async () => {
        try {
            const { ethereum } = window;
            const provider = await new ethers.providers.Web3Provider(ethereum!);
            const signer = provider.getSigner();
            const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";
            const _fee = parseFloat(fee) * 100;

            const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];
            const factory: Contract = await new ethers.Contract(
                factoryAddress,
                factoryAbi,
                signer
            );
            const address0 = "0x0000000000000000000000000000000000000000";
            type Token = "WETH" | "DAI" | "WBTC" | "USDC";

            const _token1: Token = token1 as Token;
            const _token2: Token = token2 as Token;

            const token1Addr: string = contractAddresses[_chainId][_token1][0];
            const token2Addr: string = contractAddresses[_chainId][_token2][0];

            const poolAddr = await factory.getPoolAddress(token1Addr, token2Addr, _fee);
            if (poolAddr === address0) {
                setToken1Liquidity(0);
                setToken2Liquidity(0);
                setToken1Supply("0");
                setToken2Supply("0");
                return;
            }

            const pool: Contract = await new ethers.Contract(poolAddr, poolAbi, signer);
            const reserves = await pool.getReserves();
            const tokens = await pool.getTokens();
            const totalSupply = ethers.utils.formatEther(await pool.totalSupply());
            const _liquidity = await pool.balanceOf(account);
            let liquidity: string;

            if (+_liquidity) {
                liquidity = ethers.utils.formatEther(_liquidity);
            } else {
                liquidity = "0";
            }

            const reserve1 = ethers.utils.formatEther(reserves._reserve1);
            const reserve2 = ethers.utils.formatEther(reserves._reserve2);

            if (tokens._token1 === token1Addr) {
                setToken1Liquidity((+reserve1 * +liquidity) / +totalSupply);
                setToken2Liquidity((+reserve2 * +liquidity) / +totalSupply);
                setToken1Supply(reserve1);
                setToken2Supply(reserve2);
            } else {
                setToken1Liquidity((+reserve2 * +liquidity) / +totalSupply);
                setToken2Liquidity((+reserve1 * +liquidity) / +totalSupply);
                setToken1Supply(reserve2);
                setToken2Supply(reserve1);
            }
        } catch (e) {
            console.log(e);
        }
    };

    async function removeLiquidity() {
        try {
            const _fee = parseFloat(fee) * 100;
            setIsOkDisabled(true);
            const { ethereum } = window;
            const provider = await new ethers.providers.Web3Provider(ethereum!);
            const signer = provider.getSigner();
            const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";

            const routerAddress: string = contractAddresses[_chainId]["Router"][0];
            console.log(routerAddress);

            type Token = "WETH" | "DAI" | "WBTC" | "USDC";

            const _token1: Token = token1 as Token;
            const _token2: Token = token2 as Token;

            const token1Addr: string = contractAddresses[_chainId][_token1][0];
            const token2Addr: string = contractAddresses[_chainId][_token2][0];

            const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];
            const factory: Contract = await new ethers.Contract(
                factoryAddress,
                factoryAbi,
                signer
            );

            const poolAddr = await factory.getPoolAddress(token1Addr, token2Addr, _fee);
            const pool: Contract = await new ethers.Contract(poolAddr, poolAbi, signer);

            const _liquidity: number = +(await pool.balanceOf(account));

            if (!_liquidity) {
                alert("You don't have any liquidity");
                return;
            }

            const routerContract = await new ethers.Contract(routerAddress, routerAbi, signer);

            const reserves = await pool.getReserves();
            const tokens = await pool.getTokens();
            const totalSupply = +ethers.utils.formatEther(await pool.totalSupply());

            let reserve1: number;
            let reserve2: number;

            if (tokens._token1 === token1Addr) {
                reserve1 = +ethers.utils.formatEther(reserves._reserve1);
                reserve2 = +ethers.utils.formatEther(reserves._reserve2);
            } else {
                reserve2 = +ethers.utils.formatEther(reserves._reserve1);
                reserve1 = +ethers.utils.formatEther(reserves._reserve2);
            }

            const _liquidityAmount =
                ((+amount1 * totalSupply) / reserve1 + (+amount2 * totalSupply) / reserve2) / 2;

            const liquidityAmount = ethers.utils.parseEther(_liquidityAmount.toString());

            console.log("liquidity amount", _liquidityAmount);

            console.log("approving");
            let tx = await pool.approve(routerAddress, liquidityAmount);

            console.log("waiting for approval...");
            let txReceipt = await tx.wait(1);

            if (txReceipt.status === 1) {
                console.log("Approved!");
            } else {
                alert("Tx Not approved");
                return;
            }

            console.log("removing liquidityAmount...");
            tx = await routerContract.removeLiquidity(
                liquidityAmount,
                token1Addr,
                token2Addr,
                _fee
            );

            console.log("waiting for tx...");
            txReceipt = await tx.wait();
            if (txReceipt.status === 1) {
                console.log("Removed liquidity!");
                handleRemoveLiquiditySuccess();
            } else {
                alert("Tx Failed!");
            }
            setIsOkDisabled(false);
        } catch (e) {
            console.log(e);
            setIsOkDisabled(true);
            console.log("this error is coming from remove liquidity function");
        }
    }

    const handleRemoveLiquiditySuccess = async function () {
        onClose && onClose();
        dispatch({
            type: "success",
            title: "Liquidity removed!",
            message: "Liquidity removed - Please Refresh",
            position: "topL",
        });
    };

    async function updateUI() {
        await updateOptions();
        await showTokenSupply();
        await updateAmount2();
    }

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled, token1, token2, amount1, fee]);

    return (
        <div className="pt-2">
            <Modal
                isVisible={isVisible}
                onCancel={onClose}
                onCloseButtonPressed={onClose}
                onOk={removeLiquidity}
                title={`Remove Liquidity`}
                width="450px"
                isCentered={true}
                isOkDisabled={
                    amount2 === "Why are you choosing same token kid?" || token1Liquidity === 0
                        ? true
                        : isOkDisabled
                }
            >
                <div className=" grid grid-cols-1 gap-3 place-content-center h-35">
                    <div className="grid grid-cols-2 gap-3 place-content-stretch h-35">
                        <Input
                            label="Amount"
                            name="Amount"
                            type="text"
                            onChange={(e) => {
                                if (e.target.value === "" || +e.target.value <= 0) return;
                                setTimeout(() => {
                                    setAmount1(e.target.value);
                                    updateAmount2();
                                }, 1000);
                            }}
                            value={amount1}
                            disabled={token1Liquidity === 0 ? true : isOkDisabled}
                        />
                        <Select
                            defaultOptionIndex={0}
                            label="Token"
                            onChange={async (OptionProps) => {
                                setToken1(OptionProps.label.toString());
                            }}
                            options={OptionProps}
                            disabled={isOkDisabled}
                        />
                        <div className="pt-6">
                            <Input
                                label="Amount"
                                name="Amount"
                                type="text"
                                disabled={token1Liquidity === 0 ? true : input2Disabled}
                                value={amount2}
                            />
                        </div>
                        <div className="pt-6">
                            <Select
                                defaultOptionIndex={2}
                                label="Token"
                                onChange={(OptionProps) => {
                                    setToken2(OptionProps.label.toString());
                                }}
                                options={OptionProps}
                                disabled={isOkDisabled}
                            />
                        </div>
                        <div className="pt-6 pl-24">
                            <Select
                                defaultOptionIndex={1}
                                label="Fee"
                                onChange={(OptionProps) => {
                                    setFee(OptionProps.label.toString());
                                }}
                                disabled={isOkDisabled}
                                options={[
                                    {
                                        id: "0.01%",
                                        label: "0.01%",
                                    },
                                    {
                                        id: "0.3%",
                                        label: "0.3%",
                                    },
                                    {
                                        id: "1%",
                                        label: "1%",
                                    },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="pl-4">{`Total ${token1} Liquidity - ${(+token1Supply).toFixed(
                        2
                    )}`}</div>
                    <div className="pl-4">{`Total ${token2} Liquidity - ${(+token2Supply).toFixed(
                        2
                    )}`}</div>
                    <div className="pl-4">{`Your ${token1} Liquidity - ${token1Liquidity.toFixed(
                        2
                    )}`}</div>
                    <div className="pl-4">{`Your ${token2} Liquidity - ${token2Liquidity.toFixed(
                        2
                    )}`}</div>
                </div>

                <div className="pb-8"></div>
            </Modal>
        </div>
    );
}
