# Multichain deposit 

> [!WARNING]  
> - This example has not been formally audited and involves real funds. Please exercise extreme caution and conduct thorough due diligence before using it in production.
> - The deposit functionality across different chains has not been fully tested. The intents infrastructure is actively evolving, which may affect compatibility.
> - This example is configured for mainnet only. Usage may result in permanent loss of funds.
> - Storage management features are not implemented in this version.

<video width="600" controls>
  <source src="demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Introduction

This example demonstrates how to deposit assets from various chains into a NEAR smart contract.

It's designed as a plug and play component to make it easier for developers to get up and running with multichain projects.

This could be used to deposit foreign assets for lending protocols, staking protocols, a multichain prediction market, and so on.

## Running the example 

- Clone the repo

- Test the contract
```bash
cd contract
cargo test
```

- Build and deploy the example contract
```bash
cargo near deploy build-non-reproducible-wasm <example-account.near> with-init-call new json-args '{"intents_contract_id": "intents.near"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' network-config mainnet
```

- Create a .env file in the frontend directory and point to your deployed contract
```env
NEXT_PUBLIC_CONTRACT_ID="example-contract.near"
```

- Install dependencies and run the frontend 
```bash
cd frontend
npm install
npm run dev
```

## Flow 

1) Select the token you want to deposit and the chain to deposit from. 
2) Deposit tokens into the address provided for a specific chain.
3) Lock the deposited tokens in the example NEAR smart contract.
4) Provide your wallet address and the unlock the tokens from the contract and withdraw them to your wallet on another chain.

## How it works 

This example uses the [intents.near](https://github.com/near/intents) contract and its bridges to have a representation of foreign assets on NEAR. When you deposit assets into the deposit address, the bridge locks your token and `mints` you [NEP245](https://nomicon.io/Standards/Tokens/MultiToken/Core) `multi-tokens`. The generated `deposit address` is unique to the chain and the NEAR account Id submitted, the submitted account Id will become the owner of the minted multi-tokens. The POA bridge currently being used is centralized, bridges integrated with the intents contract in the future will be decentralized.

The intents contract is a `multi-token contract` itself, it keeps track of the balances of many tokens. These tokens are actually `wrappers` around other tokens on NEAR; most of these tokens are NEP141 tokens, but can also be other NEP245 tokens or even NEP171 tokens. You can unwrap these tokens into their representation on NEAR but to reduce the number of transactions and button clicks needed, this example keeps assets in their intents.near wrapped form.

To lock the assets in a contract, the user calls the `mt_transfer_call` function on the `intents.near` multi-token contract with the target contract as an argument. This call transfers ownership of the tokens to the example contract and calls the `mt_on_transfer` function on the example contract. In this repo, the example contract just stores the number of locked tokens a user has for each token. The idea is that you will modify this contract to actually do something (staking, paying for services, prediction market, lending, etc).

When a user wants to unlock the tokens from the example contract, they call the `withdraw` function on the example contract, which gets the balance of the user and transfers them that many tokens by making a [cross contract call](https://docs.near.org/smart-contracts/anatomy/crosscontract) to the `mt_transfer` function on the intents.near contract, then if the call is successful, removes the user's balance from the example contract. 

In the same button click, once the unlock has been completed, the user calls `ft_withdraw` (ft because the tokens' unwrapped representation on NEAR is a fungible token in the POA bridge case), with args to withdraw to a certain address. This makes a call to the unwrapped representation token contract to bridge the funds to the specified address. When withdrawing a fee is taken as specified in the token details.

## Key parts 

### Frontend

#### Wallet Setup

Sets up the NEAR wallet selector and wraps the app's pages in the wallet selector context.

[Source Code](./frontend/src/app/provider.js)

#### Main page

Features all the frontend components. 

[Source Code](./frontend/src/app/page.js)

#### Get Available Tokens  

Lists available tokens that the intents infrastructure supports; this can be fetched by calling the bridge API. This example only supports tokens from the POA bridge, so the available tokens are filtered appropriately by using a list of tokens and their respective bridges (taken from the defuse frontend repo).

[Source Code](./frontend/src/app/components/TokenSelector.js#L18-L27)

#### Display Token Details 

Shows the token details for a specified token.

[Source Code](./frontend/src/app/components/AssetDetails.js)

#### Generate Deposit Address 

Generates a deposit address for the desired chain and NEAR account Id. When funds are deposited, the specified NEAR account Id becomes the owner of tokens in the NEAR intents contract.

[Source Code](./frontend/src/app/components/DepositAddress.js#L21-L41)

#### Get Recent Deposits 

Fetches recent deposits into the intents contract/bridge and their status.

[Source Code](./frontend/src/app/components/RecentDeposits.js#L19-L38)

#### Get Deposit Balance

Views the total balance of the desired token from the intents contract.

[Source Code](./frontend/src/app/components/DepositBalance.js#L22-L29)

#### Lock in Contract

Locks the tokens in the example contract. This is done by calling `mt_transfer_call` on the intents contract and specifying the example contract as an argument. The function transfers the tokens from the user to the example contract and calls the `mt_on_transfer` function on the example contract.

[Source Code](./frontend/src/app/components/LockInContract.js#L33-L44)

#### Get Contract Balance

Views the balance of the tokens locked in the example contract for a specified account Id and token Id.

[Source Code](./frontend/src/app/components/ViewContractBal.js#L22-L29)

#### Unlock from Contract

Sends the user back the tokens they had locked in the example contract for a specific token Id.

Unlocking and withdrawing feature in the same component/button click to decrease the number of required steps for the user.

[Source Code](./frontend/src/app/components/UnlockWithdrawToken.js#L34-L41)

#### Withdraw to Native Chain

Bridges the tokens back to the chain they came from by calling `ft_withdraw` on the intents contract (ft because the tokens' unwrapped representation on NEAR is a fungible token in the POA bridge case). The user needs to specify the address on the foreign chain they want to withdraw to. When withdrawing a fee is taken as specified in the token details. `signAndSendTransaction` is used so the transaction hash of the call can be used in the next step. 

[Source Code](./frontend/src/app/components/UnlockWithdrawToken.js#L99-L118)

#### Get Withdrawal Status

Gets the withdrawal status of bridging for a specified NEAR transaction hash by calling the bridge API.

[Source Code](./frontend/src/app/components/WithdrawalStatus.js#L13-L22)

### Example Contract 

The example contract simply allows users to deposit into the contract with the intents multi-token, withdraw, and view their balances. Token balances are stored in a nested map of token Id and the user's account Id.

#### Deposit Function

The `mt_on_transfer` function is called when the user calls `mt_transfer_call` on the intents contract. It provides the amount of tokens transferred and the account Id of the sender.
The contract implements the `Nep245Receiver` from [near-sdk-contract-tools](https://github.com/near/near-sdk-contract-tools) so the vector arguments are properly deserialized from the cross contract call and it ensures that the function matches the NEP-245 standard interface.

The function:
1) Checks that only one token is being transferred (multi-tokens support the transferring of multiple assets at once).
2) Only allows deposits from the intents contract.
3) Creates the user a new token map if one is not already created.
4) Checks the token balance for the user and the deposited token. There are three cases:
    1) The token entry does not yet exist, thus, a new entry is created with the amount deposited.
    2) The token entry exists, but its balance is 0; this means a withdrawal is already in progress, so the contract panics.
    3) The token entry exists and is not 0; the amount deposited is added to the existing balance.
5) The function returns 0 to show that all tokens have been used by the call if the call was successful up to this point.

[Source Code](./contract/src/lib.rs#L28-L88)

#### Withdraw Token Function

This function withdraws the entire user's balance for a specified token. This function can be adapted so that a specific amount to withdraw can be specified.

The function:
1) Gets the user's balance for the token specified (if the balance is 0, it means either a withdrawal is in progress or the user doesn't have a balance for that token, so the contract panics).
3) The user's balance is set to 0.
3) A cross contract call of `mt_transfer` is made to the intents contract to send the tokens to the user.
4) A callback is used to check if the transfer was successful; if successful, the token entry is removed, if not, the contract state is reset.

[Source Code](./contract/src/lib.rs#L101-L159)

#### Get Token Balance 

The contract implements a view function to view the number of tokens for a specific account and a specific token Id.

[Source Code](./contract/src/lib.rs#L182-L190)

#### Get Tokens for an Account

The contract also has another view function (not used in the frontend) to see all the tokens and their balances for a specific account.

[Source Code](./contract/src/lib.rs#L161-L180)

## Further Work
- Migrate to decentralized bridges, support bridges other than POA (direct deposit, Aurora, Hot, and Omnibridge).
- Add support for signing with non-near wallets, there are two ways to do this:
    - Migrate all function calls to signatures (intents already supports this) and add signature verification in the contract.
    - Use foreign wallet connectors that already exist, like the Bitcoin wallet selector from https://www.satos.network/

Please feel free to contribute these!

## Support 

> [!TIP]
> If you have questions regarding this repo or chain abstraction, please feel free to ask questions in our [Telegram Group](https://t.me/chain_abstraction) or join our [Office Hours](https://calendly.com/owen-proximity/office-hours).
