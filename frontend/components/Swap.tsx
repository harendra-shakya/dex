import { ChangeEvent, useEffect, useState } from "react";
import { Modal, useNotification, Input, Select, Button } from "@web3uikit/core";
import { useMoralis } from "react-moralis";
import { ethers, Contract, ContractInterface } from "ethers";
import contractAddresses from "../constants/networkMapping.json";
import routerAbi from "../constants/Router.json";
import factoryAbi from "../constants/Factory.json";
import poolAbi from "../constants/Pool.json";
import { OptionProps } from "@web3uikit/core";

export default function Swap(): JSX.Element {
    const { isWeb3Enabled, account, chainId } = useMoralis();
    const [amount1, setAmount1] = useState<string>("0");
    const [amount2, setAmount2] = useState<string>("0");
    const [token1, setToken1] = useState("WETH");
    const [token2, setToken2] = useState("DAI");
    const [swapDisabled, setSwapDisabled] = useState(false);
    const [OptionProps, setOptionProps] = useState<OptionProps[]>();
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
        console.log("pool", pool);
        return pool;
    }

    async function getPath(
        factory: Contract,
        tokenIn: string,
        tokenOut: string
    ): Promise<string[]> {
        try {
            const path: string[] = [tokenIn, tokenOut];
            const address0 = "0x0000000000000000000000000000000000000000";
            let pool = await getPoolAddress(factory, tokenIn, tokenOut); // 0.01%
            if (pool !== address0) return path;
            path.pop();
            console.log("building path");
            const allPairs = await factory.getAllPairs();
            console.log("allPairs", allPairs);
            if (allPairs.length === 0) throw "No pair exists";

            allPairs.forEach(async (pair: string[2], i: number) => {
                let _token1 = tokenIn;
                let _token2 = tokenOut;
                if (pair.includes(_token2) && !pair.includes(_token1)) {
                    let token: string;
                    if (pair[0] === _token2) token = pair[1];
                    else token = pair[0];
                    if ((await getPoolAddress(factory, _token1, token)) !== address0)
                        path.push(token);
                }
                _token1 = pair[0];
                _token2 = pair[1];
            });

            path.push(tokenOut);
            return path;
        } catch (e) {
            console.log(e);
            console.log("This error is coming from getPath");
            throw e;
        }
    }

    useEffect(() => {
        updateAmount2();
    }, [amount1]);

    const updateAmount2 = async () => {
        try {
            setSwapDisabled(true);
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

            const path: string[] = await getPath(factory, token1Addr, token2Addr);
            for(let i = 0; i < path.length; i++){
                const pool: Contract = await new ethers.Contract(poolAddr, poolAbi, signer);
                const amountOut = await pool.getAmountOut(
                token1Addr,
                ethers.utils.parseEther(amount1)
            );
            }

            if (poolAddr === address0) {
                setSwapDisabled(false);
                throw "error: This pool not exists";
            }
            

            setAmount2(ethers.utils.formatEther(amountOut));
            setSwapDisabled(false);
        } catch (e) {
            console.log(e);
        }
    };

    async function swap() {
        try {
            setSwapDisabled(true);
            const { ethereum } = window;
            const provider = await new ethers.providers.Web3Provider(ethereum!);
            const signer = provider.getSigner();
            const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";

            const routerAddress: string = contractAddresses[_chainId]["Router"][0];
            const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];
            const address0 = "0x0000000000000000000000000000000000000000";

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

            const path: string[] = await getPath(factory, token1Addr, token2Addr);
            console.log("path", path);

            const router = await new ethers.Contract(routerAddress, routerAbi, signer);
            const tx = await router._swap(amount1, path, account);
            const txReceipt = await tx.wait();

            if (txReceipt.status === 1) {
                console.log("Swaped!");
                handleSwapSuccess();
            }
            setSwapDisabled(false);
        } catch (e) {
            console.log(e);
            console.log("error is coming from swap function");
            setSwapDisabled(false);
        }
    }

    const handleSwapSuccess = async function () {
        dispatch({
            type: "success",
            title: "Token Swaped!",
            message: "Damnnn I am so cool",
            position: "topR",
        });
    };

    return (
        <div className="pt-48 pl-96 grid grid-cols-2 gap-3 place-content-center h-35">
            <div className="grid grid-cols-2 gap-3 place-content-stretch h-35">
                <Input
                    label="Token1"
                    name="Token1"
                    type="text"
                    onChange={(e) => {
                        if (e.target.value !== "" && +e.target.value <= 0) return;
                        setTimeout(() => {
                            setAmount1(e.target.value);
                            updateAmount2();
                        }, 1000);
                    }}
                    disabled={swapDisabled}
                    value={amount1}
                />
                <Select
                    defaultOptionIndex={0}
                    label="Token"
                    onChange={async (OptionProps) => {
                        setToken1(OptionProps.label.toString());
                    }}
                    options={OptionProps}
                    disabled={swapDisabled}
                />
                <div className="pt-6">
                    <Input
                        label="Token2"
                        name="Token2"
                        type="text"
                        // onChange={(e) => {}}
                        value={amount2}
                        disabled={true}
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
                        disabled={swapDisabled}
                    />
                </div>
                <div className="pt-6 pl-48">
                    <Button
                        onClick={swap}
                        text={"Swap"}
                        isLoading={swapDisabled}
                        theme="primary"
                        size="large"
                        disabled={swapDisabled}
                    />
                </div>
            </div>
        </div>
    );
}
