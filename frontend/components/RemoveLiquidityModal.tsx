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

declare var window: any;

type RemoveLiquidityModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

export default function RemoveLiquidityModal({ isVisible, onClose }: RemoveLiquidityModalProps) {
    const { isWeb3Enabled, account, chainId } = useMoralis();
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [token1Liquidity, setToken1Liquidity] = useState(0);
    const [token2Liquidity, setToken2Liquidity] = useState(0);
    const [OptionProps, setOptionProps] = useState<OptionProps[]>();
    const [token1, setToken1] = useState("WETH");
    const [token1Supply, setToken1Supply] = useState("");
    const [token2Supply, setToken2Supply] = useState("");
    const [token2, setToken2] = useState("DAI");
    const [fee, setFee] = useState("0.3");
    const [liquidity, setLiquidity] = useState("10%");
    const dispatch = useNotification();
    const [info, setInfo] = useState("");

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

    const showTokenSupply = async () => {
        try {
            setInfo("");
            if (token1 === token2) {
                setInfo("Info: Same token not allowed");
                return;
            }

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
                setIsOkDisabled(false);
                setInfo("Info: No pool exists!");
                return;
            }

            const pool: Contract = await new ethers.Contract(poolAddr, poolAbi, signer);
            const reserves = await pool.getReserves();
            const tokens = await pool.getTokens();
            const totalSupply = ethers.utils.formatEther(await pool.totalSupply());
            const _liquidity: string = await pool.balanceOf(account);
            let liquidityAmount: string;

            if (+_liquidity) {
                liquidityAmount = ethers.utils.formatEther(_liquidity);
            } else {
                liquidityAmount = "0";
                setInfo("Info: You don't have any liquidity");
            }

            console.log("liq", +_liquidity);

            const reserve1 = ethers.utils.formatEther(reserves._reserve1);
            const reserve2 = ethers.utils.formatEther(reserves._reserve2);
            const userLiquidity1 = (+reserve1 * +liquidityAmount) / +totalSupply;
            const userLiquidity2 = (+reserve2 * +liquidityAmount) / +totalSupply;

            if (tokens._token1 === token1Addr) {
                setToken1Liquidity(userLiquidity1);
                setToken2Liquidity(userLiquidity2);
                setToken1Supply(reserve1);
                setToken2Supply(reserve2);
            } else {
                setToken1Liquidity(userLiquidity2);
                setToken2Liquidity(userLiquidity1);
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

            const routerContract = await new ethers.Contract(routerAddress, routerAbi, signer);

            const userBal = parseInt(await pool.balanceOf(account));
            console.log("userBal", userBal);
            console.log("liquidity %", parseInt(liquidity));
            const _liquidity = parseInt(liquidity) / 100;

            const liquidityAmount: string = (_liquidity * userBal).toString();
            console.log("removing", +liquidityAmount);

            if (!+liquidityAmount || !userBal) {
                alert("You don't have any liquidity");
                return;
            }

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
        // await updateAmount2();
    }

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled, token1, token2, liquidity, fee]);

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
                isOkDisabled={token1Liquidity === 0 ? true : isOkDisabled}
            >
                <div className="grid grid-cols-1 gap-3 place-content-center h-35">
                    <div className="grid grid-cols-2 gap-3 place-content-stretch h-35">
                        <div className="">
                            <Select
                                defaultOptionIndex={0}
                                label="% Amount"
                                onChange={(OptionProps) => {
                                    setLiquidity(OptionProps.label.toString());
                                }}
                                disabled={isOkDisabled}
                                options={[
                                    {
                                        id: "10%",
                                        label: "10%",
                                    },
                                    {
                                        id: "25%",
                                        label: "25%",
                                    },
                                    {
                                        id: "50%",
                                        label: "50%",
                                    },
                                    {
                                        id: "100%",
                                        label: "100%",
                                    },
                                ]}
                            />
                        </div>
                        <Select
                            defaultOptionIndex={0}
                            label="Token"
                            onChange={async (OptionProps) => {
                                setToken1(OptionProps.label.toString());
                            }}
                            options={OptionProps}
                            disabled={isOkDisabled}
                        />
                        <div className="pt-6"></div>
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
                    <div className="pl-4">{info}</div>
                </div>

                <div className="pb-8"></div>
            </Modal>
        </div>
    );
}
