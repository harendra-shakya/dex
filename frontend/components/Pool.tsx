import { Table, Button } from "@web3uikit/core";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useMoralis } from "react-moralis";
import AddLiquidityModal from "./AddLiquidityModal";
import { ethers, Contract, ContractInterface } from "ethers";
import contractAddresses from "../constants/networkMapping.json";
import routerAbi from "../constants/Router.json";
import factoryAbi from "../constants/Factory.json";
import { OptionProps } from "@web3uikit/core";
import tokenNames from "../constants/helper.json";

export default function Pool(): JSX.Element {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { isWeb3Enabled, chainId, account } = useMoralis();
    const [data, setData] = useState<(string | JSX.Element)[][]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [existingPools, setExistingPools] = useState<string[]>();

    console.log("data", data);

    async function getPoolAddress(
        factory: Contract,
        _token1: string,
        _token2: string
    ): Promise<{
        pool: string;
        fee: string;
    }> {
        const address0 = "0x0000000000000000000000000000000000000000";
        let pool: string = await factory.getPoolAddress(_token1, _token2, 1); // 0.01%
        if (pool !== address0 && !existingPools?.includes(pool))
            return {
                pool: pool,
                fee: "0.01%",
            };

        pool = await factory.getPoolAddress(_token1, _token2, 30); // 0.3%
        if (pool !== address0 && !existingPools?.includes(pool))
            return {
                pool: pool,
                fee: "0.3%",
            };

        pool = await factory.getPoolAddress(_token1, _token2, 100); // 1%
        if (pool !== address0 && !existingPools?.includes(pool))
            return {
                pool: pool,
                fee: "0.1%",
            };

        return {
            pool: address0,
            fee: "0.1%",
        };
    }

    const showTable = async () => {
        const { ethereum } = window;
        const provider = await new ethers.providers.Web3Provider(ethereum!);
        const signer = provider.getSigner();
        const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";

        const routerAddress: string = contractAddresses[_chainId]["Router"][0];
        const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];
        const address0 = "0x0000000000000000000000000000000000000000";
        const factory: Contract = await new ethers.Contract(factoryAddress, factoryAbi, signer);
        const _tokens: unknown = tokenNames as unknown;
        const tokens: string = _tokens as string;

        const allPairs = await factory.getAllPairs();
        console.log("allPairs", allPairs);
        if (allPairs.length === 0) throw "No pool exists";

        const _data: (string | JSX.Element)[][] = [];

        for (let pair of allPairs) {
            const poolObj = await getPoolAddress(factory, pair[0], pair[1]);

            if (poolObj.pool !== address0) {
                let _existingPools: string[];
                if (existingPools) {
                    _existingPools = existingPools;
                } else {
                    _existingPools = [];
                }
                _existingPools.push(poolObj.pool);
                setExistingPools(_existingPools);
                const token1: string = tokens[_chainId][pair[0]] as string;
                console.log(console.log("token1", token1));
                const _fee: string = await poolObj.fee;

                const token2: string = tokens[_chainId][pair[1]] as string;
                console.log(console.log("token2", token2));

                _data.push([
                    <Image src={`/${token1.toLowerCase()}.svg`} width={40} height={40} />,
                    <Image src={`/${token2.toLowerCase()}.svg`} width={40} height={40} />,
                    <div
                        className="opacity-100 hover:opacity-60"
                        onClick={() => {
                            console.log("yes");
                        }}
                    >
                        {token1}/{token2}
                    </div>,
                    `${_fee}`,
                    "10000 B",
                    "1 B",
                    "10 B",
                    <Button
                        onClick={() => {
                            setShowModal(true);
                        }}
                        text="Add Liquidity"
                        theme="primary"
                    />,
                ]);
            }
        }

        setData(_data);
    };

    // const showTable = async () => {
    //     const _data: (string | JSX.Element)[][] = [];
    //     _data.push([
    //         <Image src="/usdc.svg" width={40} height={40} />,
    //         <Image src="/dai.svg" width={40} height={40} />,
    //         <div
    //             className="opacity-100 hover:opacity-60"
    //             onClick={() => {
    //                 console.log("yes");
    //             }}
    //         >
    //             USDC/DAI
    //         </div>,
    //         "0.01%",
    //         "10000 B",
    //         "1 B",
    //         "10 B",
    //         <Button
    //             onClick={() => {
    //                 setShowModal(true);
    //             }}
    //             text="Add Liquidity"
    //             theme="primary"
    //         />,
    //     ]);
    //     setData(_data);
    // };

    async function updateUI() {
        await showTable();
    }

    useEffect(() => {
        updateUI();
    }, [isWeb3Enabled]);

    return (
        <div>
            <div className="p-8 pt-6 font-semibold text-3xl text-gray-500">Pools</div>
            <Table
                columnsConfig="60px 35px 1fr 3fr 1fr 1fr 1fr 160px 30px"
                data={data}
                header={[
                    "",
                    "",
                    <span>Pool</span>,
                    <span>Fee</span>,
                    <span>TVL</span>,
                    <span>Volume 24H</span>,
                    <span>Volume 7D</span>,
                    "",
                ]}
                maxPages={1}
                pageSize={8}
                isLoading={isLoading}
            />
            <AddLiquidityModal isVisible={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}

/**
 * <Image src="/usdc.svg" width={40} height={40} />,
            <Image src="/dai.svg" width={40} height={40} />,
            "USDC/DAI",
            "10000 B",
            "1 B",
            "10 B",
            <Button onClick={function noRefCheck() {}} text="Add Liquidity" theme="primary" />,
 */
