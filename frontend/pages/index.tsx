import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { useNotification } from "@web3uikit/core";
import Swap from "../components/Swap";

export default function Home(): JSX.Element {
    const { isWeb3Enabled, chainId, account } = useMoralis();
    const dispatch = useNotification();
    const [isFetching, setIsFetching] = useState(false);

    return (
        <div>
            {isWeb3Enabled ? (
                <div>
                    {parseInt(chainId!) === 80001 ? (
                        !isFetching ? (
                            <div>
                                <Swap />
                            </div>
                        ) : (
                            <div>Loading....</div>
                        )
                    ) : (
                        <div>Plz Connect to Polygon Mumbai testnet</div>
                    )}
                </div>
            ) : (
                <div>Please Connect Your Wallet</div>
            )}
        </div>
    );
}
