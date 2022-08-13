import { useEffect, useState } from "react";
import { Modal, useNotification, Input, Select } from "@web3uikit/core";
import { useMoralis } from "react-moralis";
import { ethers } from "ethers";
import { OptionProps } from "@web3uikit/core";
import contractAddresses from "../constants/networkMapping.json";
import routerAbi from "../constants/Router.json";
import tokenAbi from "../constants/Token.json";

type AddLiquidityModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

export default function AddLiquidityModal({ isVisible, onClose }: AddLiquidityModalProps) {
    const { isWeb3Enabled, account, chainId } = useMoralis();
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [amount1, setAmount1] = useState("");
    const [amount2, setAmount2] = useState("");
    const [OptionProps, setOptionProps] = useState<OptionProps[]>();
    const [token1, setToken1] = useState("WETH");
    const [token2, setToken2] = useState("DAI");
    const [fee, setFee] = useState("0.3");
    const dispatch = useNotification();

    const allTokens = ["WETH", "WBTC", "DAI", "USDC"];

    async function updateUI() {
        let _data: OptionProps[] = [];
        allTokens.forEach(async (token, i) => {
            _data.push({
                id: token,
                label: token,
            });
        });
        setOptionProps(_data);
    }

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled]);

    async function addLiquidity() {
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
            const _amount1 = ethers.utils.parseEther(amount1);
            const _amount2 = ethers.utils.parseEther(amount2);

            const token1Addr: string = contractAddresses[_chainId][_token1][0];
            const token2Addr: string = contractAddresses[_chainId][_token2][0];

            const token1Contract = await new ethers.Contract(token1Addr, tokenAbi, signer);
            const token2Contract = await new ethers.Contract(token2Addr, tokenAbi, signer);
            let tx = await token1Contract.approve(routerAddress, _amount1);
            let tx2 = await token2Contract.approve(routerAddress, _amount2);
            let txReceipt = await tx.wait(1);
            let txReceipt2 = await tx2.wait(1);

            if (txReceipt.status === 1 && txReceipt2.status === 1) {
                console.log("Approved!");
            }

            const contract = await new ethers.Contract(routerAddress, routerAbi, signer);

            console.log("adding liquidity...");
            tx = await contract.addLiquidity(token1Addr, token2Addr, _amount1, _amount2, _fee);
            console.log("waiting for tx...");
            txReceipt = await tx.wait();
            if (txReceipt.status === 1) {
                console.log("Added liquidity!");
                handleAddLiquiditySuccess();
            }
            setIsOkDisabled(false);
        } catch (e) {
            console.log(e);
            setIsOkDisabled(true);
            console.log("this error is coming from add liquidity");
        }
    }

    const handleAddLiquiditySuccess = async function () {
        onClose && onClose();
        dispatch({
            type: "success",
            title: "Liquidity added!",
            message: "Liquidity added - Please Refresh",
            position: "topR",
        });
    };

    const updateAmount1 = async () => {
        // setAmount1("100");
    };

    const updateAmount2 = async () => {
        // setAmount2("200");
    };

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled]);

    return (
        <div className="pt-2">
            <Modal
                isVisible={isVisible}
                onCancel={onClose}
                onCloseButtonPressed={onClose}
                onOk={addLiquidity}
                title={`Add Liquidity`}
                width="450px"
                isCentered={true}
                isOkDisabled={isOkDisabled}
            >
                <div className=" grid grid-cols-1 gap-3 place-content-center h-35">
                    <div className="grid grid-cols-2 gap-3 place-content-stretch h-35">
                        <Input
                            label="Amount"
                            name="Amount"
                            type="text"
                            onChange={async (e) => {
                                setAmount1(e.target.value);
                                updateAmount2();
                            }}
                            value={amount1}
                            disabled={isOkDisabled}
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
                                onChange={(e) => {
                                    setAmount2(e.target.value);
                                    updateAmount1();
                                }}
                                disabled={isOkDisabled}
                                value={amount2}
                            />
                        </div>
                        <div className="pt-6">
                            <Select
                                defaultOptionIndex={1}
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
                </div>

                <div className="pb-12"></div>
            </Modal>
        </div>
    );
}
