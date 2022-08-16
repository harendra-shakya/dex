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
import poolAbi from "../constants/Pool.json";
import RemoveLiquidityModal from "./RemoveLiquidityModal";
declare var window: any;


export default function Pool(): JSX.Element {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { isWeb3Enabled, chainId, account } = useMoralis();
    const [data, setData] = useState<(string | JSX.Element)[][]>([]);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
    const [existingPools, setExistingPools] = useState<string[]>();

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
                fee: "1%",
            };

        return {
            pool: address0,
            fee: "1%",
        };
    }

    async function getTVL(poolAddr: string) {
        const { ethereum } = window;
        const provider = await new ethers.providers.Web3Provider(ethereum!);
        const signer = provider.getSigner();
        const pool: Contract = await new ethers.Contract(poolAddr, poolAbi, signer);
        const reserves = await pool.getReserves();
        const r1 = ethers.utils.formatEther(reserves._reserve1);
        const r2 = ethers.utils.formatEther(reserves._reserve2);
        const tvl = +(+r1 + +r2);
        return (tvl / 10 ** 6).toFixed(2);
    }

    const showTable = async () => {
        setIsLoading(true);
        const { ethereum } = window;
        const provider = await new ethers.providers.Web3Provider(ethereum!);
        const signer = provider.getSigner();
        const _chainId: "80001" | "31337" = parseInt(chainId!).toString() as "80001" | "31337";

        const factoryAddress: string = contractAddresses[_chainId]["Factory"][0];
        const address0 = "0x0000000000000000000000000000000000000000";
        const factory: Contract = await new ethers.Contract(factoryAddress, factoryAbi, signer);
        const _tokens: unknown = tokenNames as unknown;
        const tokens: string = _tokens as string;

        const allPairs = await factory.getAllPairs();
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
                const _fee: string = await poolObj.fee;
                const tvl = await getTVL(poolObj.pool);
                const token2: string = tokens[_chainId][pair[1]] as string;

                _data.push([
                    <Image src={`/${token1.toLowerCase()}.svg`} width={40} height={40} />,
                    <Image src={`/${token2.toLowerCase()}.svg`} width={40} height={40} />,
                    `${token1}/${token2}`,
                    `${_fee}`,
                    `${(+tvl).toFixed(2)} M`,
                    `${(+tvl / 100).toFixed(2)} M`,
                    `${(+tvl / 10).toFixed(2)} M`,
                    <Button
                        onClick={() => {
                            setShowAddModal(true);
                        }}
                        text="Add Liquidity"
                        theme="primary"
                    />,
                    <Button
                        onClick={() => {
                            setShowRemoveModal(true);
                        }}
                        text="Remove Liquidity"
                        theme="primary"
                    />,
                ]);
            }
        }

        setData(_data);
        setIsLoading(false);
    };

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
                columnsConfig="60px 35px 1fr 3fr 1fr 1fr 1fr 160px 200px"
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
                    "",
                ]}
                maxPages={1}
                pageSize={8}
                isLoading={isLoading}
            />
            <AddLiquidityModal isVisible={showAddModal} onClose={() => setShowAddModal(false)} />
            <RemoveLiquidityModal
                isVisible={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
            />
        </div>
    );
}
