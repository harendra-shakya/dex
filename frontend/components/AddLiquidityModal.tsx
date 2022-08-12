import { useEffect, useState } from "react";
import { Modal, useNotification, Input, Select } from "@web3uikit/core";
import { useMoralis } from "react-moralis";
import { ethers } from "ethers";
import contractAddresses from "../constants/networkMapping.json";
import routerAbi from "../constants/Router.json";

type AddLiquidityModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

export default function AddLiquidityModal({ isVisible, onClose }: AddLiquidityModalProps) {
    const [borrowAmount, setBorrowAmount] = useState("0");
    const { isWeb3Enabled, account, chainId } = useMoralis();
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [availableTokens, setAvailableTokens] = useState("0");
    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");
    const [fee, setFee] = useState("");
    const dispatch = useNotification();

    console.log(parseFloat(fee));

    async function updateUI() {}

    async function addLiquidity() {
        const _fee = parseFloat(fee) * 100;

        const { ethereum } = window;
        const provider = await new ethers.providers.Web3Provider(ethereum!);
        const signer = provider.getSigner();
        const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";

        const address: string = contractAddresses[_chainId]["Router"][0];
        console.log(address);

        const contract = await new ethers.Contract(address, routerAbi, signer);
        // await contract.addLiquidity(token1, token2, amount1, amount2, _fee);
    }

    const updateInput1 = async () => {
        setInput1("100");
    };

    const updateInput2 = async () => {
        setInput2("200");
    };

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled, borrowAmount]);

    return (
        <div className="pt-2">
            <Modal
                isVisible={isVisible}
                onCancel={onClose!}
                onCloseButtonPressed={onClose!}
                onOk={addLiquidity}
                title={`Add Liquidity`}
                width="450px"
                isCentered={true}
                isOkDisabled={isOkDisabled}
            >
                <div
                    style={{
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <Input
                        label="Token1"
                        name="Token1"
                        type="text"
                        onChange={(e) => {
                            setInput1(e.target.value);
                            updateInput2();
                        }}
                        value={input1}
                    />
                    <div className="pt-6">
                        <Input
                            label="Token2"
                            name="Token2"
                            type="text"
                            onChange={(e) => {
                                setInput2(e.target.value);
                                updateInput1();
                            }}
                            value={input2}
                        />
                    </div>
                    <div className="pt-6">
                        <Select
                            defaultOptionIndex={1}
                            label="Fee"
                            onChange={(OptionProps) => {
                                setFee(OptionProps.label.toString());
                            }}
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
                <div className="pb-12"></div>
            </Modal>
        </div>
    );
}
