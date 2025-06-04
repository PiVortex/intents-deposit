"use client"

import { WithdrawWidget } from "@defuse-protocol/defuse-sdk"

export default function WithdrawToken() {
    return (
        <div>
            <h1>Withdraw Token</h1>
            <WithdrawWidget
                tokenId={tokenId}
                onWithdraw={handleWithdraw}
            />
        </div>
    )
}