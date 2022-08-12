import { useEffect, useState } from "react";
import { Modal, useNotification, Input, Select, Button } from "@web3uikit/core";
import { useMoralis } from "react-moralis";
import { ethers, Contract } from "ethers";
import contractAddresses from "../constants/networkMapping.json";
import routerAbi from "../constants/Router.json";
import factoryAbi from "../constants/Factory.json";

export default function Swap(): JSX.Element {
    const { isWeb3Enabled, account, chainId } = useMoralis();
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [choosed1, setChoosed1] = useState(false);
    const [choosed2, setChoosed2] = useState(false);

    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");
    const [token1, setToken1] = useState("WETH");
    const [token2, setToken2] = useState("DAI");
    const [data, setData] = useState<Object[]>();
    const dispatch = useNotification();

    const updateInput1 = async () => {
        setInput1("100");
    };

    // const allTokens = ["WETH", "WBTC", "DAI", "USDC"];

    async function updateUI() {
        //     let _data: Object[] = [];
        //     allTokens.forEach(async (token, i) => {
        //         _data.push({
        //             id: token,
        //             label: token,
        //         });
        //     });
        //     console.log("data", _data);
        //     setData(_data);
    }

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled]);

    async function getPoolAddress(
        factory: Contract,
        _token1: string,
        _token2: string
    ): Promise<string> {
        const address0 = "0x0000000000000000000000000000000000000000";
        let pool = await factory.getPoolAddress(_token1, _token2, 1); // 0.01%
        if (pool !== address0) return pool;
        pool = await factory.getPoolAddress(_token1, _token2, 30); // 0.3%
        if (pool !== address0) return pool;
        pool = await factory.getPoolAddress(_token1, _token2, 100); // 1%
        return pool;
    }

    async function getPath(factory: Contract, tokenIn: string, tokenOut: string) {
        const path: string[] = [tokenIn, tokenOut];
        const address0 = "0x0000000000000000000000000000000000000000";
        let pool = await getPoolAddress(factory, tokenIn, tokenOut); // 0.01%
        if (pool !== address0) return path;
        path.pop();

        const allPairs = await factory.getAllPairs();

        allPairs.forEach(async (pair: string[2], i: number) => {
            let _token1 = tokenIn;
            let _token2 = tokenOut;
            if (pair.includes(_token2) && !pair.includes(_token1)) {
                let token: string;
                if (pair[0] === _token2) token = pair[1];
                else token = pair[0];
                if ((await getPoolAddress(factory, _token1, token)) !== address0) path.push(token);
            }
            _token1 = pair[0];
            _token2 = pair[1];
        });

        path.push(tokenOut);
        return path;
    }

    async function swap() {
        try {
            const { ethereum } = window;
            const provider = await new ethers.providers.Web3Provider(ethereum!);
            const signer = provider.getSigner();
            const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";

            const routerAddress: string = contractAddresses[_chainId]["Router"][0];
            const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];

            const address0 = "0x0000000000000000000000000000000000000000";

            const factory = await new ethers.Contract(factoryAddress, factoryAbi, signer);
            console.log("11");
            console.log(token1);
            type Token = "WETH" | "DAI" | "WBTC" | "USDC";

            const _token1: Token = token1 as Token;
            const _token2: Token = token2 as Token;

            const token1Addr: string = contractAddresses[_chainId][_token1][0];
            const token2Addr: string = contractAddresses[_chainId][_token2][0];

            let path: string[] = await getPath(factory, token1Addr, token2Addr); // 0.3%
            // console.log(pool);
            // console.log("lets go");

            // const path = [];

            // const address1 = await getPath(factory, token1, token2);

            const router = await new ethers.Contract(routerAddress, routerAbi, signer);

            // const path: string[] = [];

            // await router._swap(input1, path, account);
        } catch (e) {
            console.log(e);
        }
    }

    const updateInput2 = async () => {
        setInput2("200");
    };

    return (
        <div className="pt-48 pl-96 grid grid-cols-2 gap-3 place-content-center h-35">
            <div className="grid grid-cols-2 gap-3 place-content-stretch h-35">
                <Input
                    label="Token1"
                    name="Token1"
                    type="text"
                    onChange={async (e) => {
                        setInput1(e.target.value);
                        updateInput2();
                    }}
                    value={input1}
                />
                <Select
                    defaultOptionIndex={0}
                    label="Token"
                    onChange={async (OptionProps) => {
                        setChoosed1(true);
                        setToken1(OptionProps.label.toString());
                    }}
                    options={[
                        {
                            id: "WETH",
                            label: "WETH",
                        },
                        {
                            id: "DAI",
                            label: "DAI",
                        },
                        {
                            id: "WBTC",
                            label: "WBTC",
                        },
                        {
                            id: "USDC",
                            label: "USDC",
                        },
                    ]}
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
                        defaultOptionIndex={2}
                        label="Token"
                        onChange={(OptionProps) => {
                            setChoosed2(true);
                            setToken2(OptionProps.label.toString());
                        }}
                        options={[
                            {
                                id: "WETH",
                                label: "WETH",
                            },
                            {
                                id: "DAI",
                                label: "DAI",
                            },
                            {
                                id: "WBTC",
                                label: "WBTC",
                            },
                            {
                                id: "USDC",
                                label: "USDC",
                            },
                        ]}
                    />
                </div>
                <div className="pt-6 pl-48">
                    <Button onClick={swap} text="Swap" theme="primary" size="large" />
                </div>
            </div>
        </div>
    );
}
