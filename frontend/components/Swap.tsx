import { Input, Button, Form } from "@web3uikit/core";

export default function Swap(): JSX.Element {
    return (
        <div className="grid grid-cols-1 gap-2 place-content-center h-48">
            <div className="justify-self-center pt-48">
                <Form
                    buttonConfig={{
                        onClick: function noRefCheck() {},
                        theme: "primary",
                        text: "Swap",
                    }}
                    data={[
                        {
                            name: "",
                            selectOptions: [
                                {
                                    id: "eth",
                                    label: "ETH",
                                },
                                {
                                    id: "wbtc",
                                    label: "WBTC",
                                },
                                {
                                    id: "usdc",
                                    label: "USDC",
                                },
                            ],
                            type: "select",
                            value: "",
                        },
                        {
                            name: "",
                            selectOptions: [
                                {
                                    id: "eth",
                                    label: "ETH",
                                },
                                {
                                    id: "wbtc",
                                    label: "WBTC",
                                },
                                {
                                    id: "usdc",
                                    label: "USDC",
                                },
                            ],
                            type: "select",
                            value: "",
                        },
                    ]}
                    onSubmit={function noRefCheck() {}}
                    title="Swap"
                    id="token"
                />
            </div>
        </div>
    );
}
