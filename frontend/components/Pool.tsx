import { Table, Button } from "@web3uikit/core";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useMoralis } from "react-moralis";
import AddLiquidityModal from "./AddLiquidityModal";

export default function Pool(): JSX.Element {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { isWeb3Enabled, chainId, account } = useMoralis();
    const [data, setData] = useState<(string | JSX.Element)[][]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);

    const showTable = async () => {
        const _data: (string | JSX.Element)[][] = [];
        _data.push([
            <Image src="/usdc.svg" width={40} height={40} />,
            <Image src="/dai.svg" width={40} height={40} />,
            "USDC/DAI",
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
        setData(_data);
    };

    useEffect(() => {
        showTable();
    }, [isWeb3Enabled]);

    return (
        <div>
            <div className="p-8 pt-6 font-semibold text-3xl text-gray-500">Pools</div>
            <Table
                columnsConfig="60px 35px 3fr 1fr 1fr 1fr 160px 30px"
                data={data}
                header={[
                    "",
                    "",
                    <span>Pool</span>,
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
