import { Table, Button } from "@web3uikit/core";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useMoralis } from "react-moralis";
import Pool from "../components/Pool";

export default function Pools(): JSX.Element {
    const [isLoading, setIsLoading] = useState(false);
    const { isWeb3Enabled, chainId, account } = useMoralis();

    return (
        <div>
            {isWeb3Enabled ? (
                <div>
                    {parseInt(chainId!) === 80001 ? (
                        !isLoading ? (
                            <div>
                                <Pool />
                            </div>
                        ) : (
                            <div>Loading....</div>
                        )
                    ) : (
                        <div>Plz Connect to Mumbai testnet</div>
                    )}
                </div>
            ) : (
                <div>Please Connect Your Wallet</div>
            )}
        </div>
    );
}
