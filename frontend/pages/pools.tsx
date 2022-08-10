import { Table, Button } from "@web3uikit/core";
import { useState } from "react";
import Image from "next/image";

export default function Pools(): JSX.Element {
    const [isLoading, setIsLoading] = useState(false);
    // const data = [[]];
    return (
        <div>
            <div>
                <div className="p-8 pt-6 font-semibold text-3xl text-gray-500">Pools</div>

                <Table
                    columnsConfig="60px 35px 3fr 1fr 1fr 1fr 160px 30px"
                    data={[
                        [
                            <Image src="/usdc.svg" width={40} height={40} />,
                            <Image src="/dai.svg" width={40} height={40} />,
                            "USDC/DAI",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/weth.svg" width={40} height={40} />,
                            <Image src="/dai.svg" width={40} height={40} />,
                            "WETH/DAI",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/usdc.svg" width={40} height={40} />,
                            "WBTC/USDC",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/dai.svg" width={40} height={40} />,
                            "WBTC/DAI",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                        [
                            <Image src="/wbtc.svg" width={40} height={40} />,
                            <Image src="/weth.svg" width={40} height={40} />,
                            "WBTC/ETH",
                            "10000 B",
                            "1 B",
                            "10 B",
                            <Button
                                onClick={function noRefCheck() {}}
                                text="Add Liquidity"
                                theme="primary"
                            />,
                        ],
                    ]}
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
            </div>
        </div>
    );
}
