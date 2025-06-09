# Multichain deposit 

> [!WARNING]  
> - This technology has not yet undergone a formal audit. Use at your own risk. This example uses the depositing of real funds please conduct your own due diligence and exercise caution before integrating or relying on it.
> - Not all deposit chains have been tested and cannot be confirmed to be working and the intents infrastructure may be updated such that this example does not work.
> - This example only works on mainnet so funds are liable to be lost.
> - This example does not implement storage management.

## Introduction

This is an example that shows how to deposit assets from different chains into a NEAR smart contract.

This is designed as a plug and play component to make it easier for developers to get up and running with multichain projects.

This could be used to deposit foreign assets for lending protocols, staking protocols, a multichain prediction market and so on.

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

1) Select the token you want to deposit and which chain to deposit from 
2) Deposit into the address provided the specified token and chain
3) Lock the deposited token in the NEAR smart contract
4) Provide your wallet address and unlock from the contract and withdraw to your wallet

## How it works 

This example uses the [intents.near](https://github.com/near/intents) contract and its bridges to have a representation of foreign assets on NEAR. When you deposit assets into the deposit address the bridge locks your token and `mints` you a [NEP245](https://nomicon.io/Standards/Tokens/MultiToken/Core) `multi-tokens`. The generated `deposit address` is unique to the chain and the NEAR account id submitted, the submitted account Id will become the owner of the minted multi-tokens.

The intents contract is a `multi-token contract` itself, it keeps track of the balances of many tokens. These tokens are actually `wrappers` around other tokens on NEAR, most of these tokens are NEP141 tokens but can also be other NEP245 tokens or even NEP171 tokens. You can unwrap these tokens into their representation on NEAR but to reduce the number of transactions and button clicks needed this example keeps assets in their intents.near wrapped form.

To lock the assets in a contract the user calls the `mt_transfer_call` function on the `intents.near` multi-token contract with the target contract as an argument. This call transfers ownerships of the tokens to the example contract and calls the `mt_on_transfer` function on the example contract. In this repo the example contract just stores the balance of the user for that token, the idea is that you will modify this contract to actually do something (staking, paying for services, prediction market, lending, etc.)

When a user wants to unlock the tokens from the example contract they call the `withdraw` function on the example contract which gets the balance of the user and transfers them that many tokens by making a [cross contract call](https://docs.near.org/smart-contracts/anatomy/crosscontract) to the `mt_transfer` function on the intents.near contract, then if the call is successful removes the user's balance.

In the same button click, once the unlock has been completed, the user calls `ft_withdraw` (ft because the tokens unwrapped representation on NEAR is a fungible token in the POA bridge case), with args to withdraw to a certain address. This makes a call to the unwrapped representation token contract to bridge the funds to the specified address.

## Key parts 

### Frontend

#### Wallet Setup

Sets up the NEAR wallet selector and wraps the apps pages in the wallet selector context.

[Source Code](./frontend/src/app/provider.js)

#### Main page

Features all the frontend's components. 

[Source Code](./frontend/src/app/page.js)

#### Get Available tokens  

Lists available tokens that the intents infrastructure supports can be fetched by calling the bridge API. This example only supports tokens from the POA bridge so the available tokens are filtered appropriately by using a list of tokens and their respective bridges.

[Source Code](./frontend/src/app/components/TokenSelector.js#L18-L27)

#### Display Token Details 

Shows the token details for a specified token.

[Source Code](./frontend/src/app/components/AssetDetails.js)

#### Generate Deposit Address 

Generates a deposit address for the desired chain and NEAR account Id. When funds are deposited the specified NEAR account Id becomes the owner of tokens in the NEAR intents contract.

[Source Code](./frontend/src/app/components/DepositAddress.js#L21-L41)

#### Get Recent Deposits 

Fetches recent deposits into the intents contract/bridge and their status.

[Source Code](./frontend/src/app/components/RecentDeposits.js#L19-L38)

#### Get Deposit Balance

Gets the total balance of the desired token from the intents contract.

[Source Code](./frontend/src/app/components/DepositBalance.js#L22-L29)

#### Lock in Contract

Locks the tokens in the example contract. This is done by calling `mt_transfer_call` on the intents contract and specifying the example contract as an argument. The function transfers the tokens from the user to the example contract and calls the `mt_on_transfer` function on the example contract.

[Source Code](./frontend/src/app/components/LockInContract.js#L33-L44)

#### Get Contract Balance

Views the balance of the tokens locked in the example contract for a specified account Id and token Id.

[Source Code](./frontend/src/app/components/ViewContractBal.js#L22-L29)

#### Unlock from Contract

Sends the user back the tokens they had locked in the example contract for a specific token Id.

Unlocking and withdrawing feature in the same component/button click to decrease the number of required steps for the user

[Source Code](./frontend/src/app/components/UnlockWithdrawToken.js#L24-L41)

#### Withdraw to Native Chain

Bridges the tokens back to the native chain by calling `ft_withdraw` on the intents contract (ft because the tokens unwrapped representation on NEAR is a fungible token in the POA bridge case). `signAndSendTransaction` is used so the transaction hash of the call can be used in the next step. The user needs to specify the address on the foreign chain they want to withdraw to.

[Source Code](./frontend/src/app/components/UnlockWithdrawToken.js#L99-L118)

#### Get Withdrawal Status

Gets the withdrawal status of bridging for a specified NEAR transaction hash by calling the bridge API.

[Source Code](./frontend/src/app/components/WithdrawalStatus.js#L13-L22)

### Example Contract 

The example contract simply just allows users to deposit into the contract with the intents multi-token, withdraw and view their balances. Tokens balances are stored in a nested map of token Id and the user's account Id.

#### Deposit Function

The `mt_on_transfer` function is called when the user calls `mt_transfer_call` on the intents contract, it provides the amount of tokens transferred and the account Id of the sender.
The contract implements the `Nep245Receiver` from `near-sdk-contract-tools` so the vector arguments are properly deserialized from the cross contract call and to ensure that the function matches the NEP-245 standard interface.

The function:
1) Checks only one token is being transferred (multi-tokens support the transferring of multiple assets at once).
2) Only allows deposits from the intents contract.
3) Creates the user a new token map if one is not already created.
4) Checks the token balance for the user and the deposited token, there are three cases:
    1) The token entry does not yet exist, thus a new entry is created with the amount deposited.
    2) The token entry exists but its balance is 0, this means a withdrawal is already in progress so the contract panics.
    3) The token entry exists and is not 0, the amount deposited is added to the existing balance.
5) The function returns 0 to show that all tokens have been used by the call if the call was successful up to this point.

[Source Code](./contract/src/lib.rs#L28-L88)

#### Withdraw Token Function

This function withdraws the entire users balance for a specified token. This function can be adapted so a specific amount to withdraw cna be specified.

The function:
1) Gets the user's balance for the token specified (if the balance is 0 it means either a withdrawal is in progress or the user doesn't have balance for that token so the contract panics).
3) The users balance is set to 0.
3) A cross contract call of `mt_transfer` is made the intents contract to send the tokens to the user.
4) A callback is used to check if the transfer was successful, if successful the token entry is removed, if not the contract state is reset.

[Source Code](./contract/src/lib.rs#L101-L159)

#### Get Token Balance 

The contract implements a view function to view the number of tokens for a specific account and a specific token Id.

[Source Code](./contract/src/lib.rs#L182-L190)

#### Get Tokens for an Account

The contract also has another view function (not used in the frontend) to see all the tokens and their balances for a specific account.

[Source Code](./contract/src/lib.rs#L161-L180)

## Further Work
- Migrate to decentralized bridges, support bridges other than POA (direct deposit, aurora, Hot and Omnibridge).
- Add support for signing with non near wallets, there are two ways to do this:
    - Migrate all function calls to signatures (intents already supports this) and add signature verification in the contract.
    - Use foreign wallet connectors that already exist like the bitcoin wallet selector from https://www.satos.network/

Please feel free to contribute these!