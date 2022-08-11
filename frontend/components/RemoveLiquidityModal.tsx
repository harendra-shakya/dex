import { useEffect, useState } from "react";
import { Modal, useNotification, Input, Select } from "@web3uikit/core";
import { useMoralis } from "react-moralis";
import { ethers } from "ethers";

type RemoveLiquidityModalProps = {
    isVisible: boolean;
    onClose: void;
};

export default function RemoveLiquidityModal({}) {
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

    async function removeLiquidity() {}

    const handleBorrowSuccess = async function () {
        // onClose && onClose();
        dispatch({
            type: "success",
            title: "Asset Borrowed!",
            message: "Asset Borrowed - Please Refresh",
            position: "topR",
        });
    };

    const updateInput1 = async function () {
        setInput1("100");
    };

    const updateInput2 = async function () {
        setInput2("200");
    };

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled, borrowAmount]);

    return (
        <div className="pt-2">
            <Modal
                isVisible={true}
                onCancel={() => {}}
                onCloseButtonPressed={() => {}}
                onOk={removeLiquidity}
                title={`Remove Liquidity`}
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
                        onChange={(event) => {
                            event.target.value = "10";
                            updateInput2();
                        }}
                        value={input1}
                    />
                    <div className="pt-6">
                        <Input
                            label="Token2"
                            name="Token2"
                            type="text"
                            onChange={(event) => {
                                event.target.value;
                                updateInput1();
                            }}
                            value={input2}
                        />
                    </div>
                    <div className="pt-6">
                        <Select
                            defaultOptionIndex={1}
                            label="Label Text"
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
