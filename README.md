# Multichain deposit 

> [!WARNING]  
> This technology has not yet undergone a formal audit. Use at your own risk. This example uses the depositing of real funds please conduct your own due diligence and exercise caution before integrating or relying on it.
> Not all deposit chains have been tested and cannot be confirmed to be working and the intents infrastructure may be updated such that this example does not work.
> This example only works on mainnet so funds are liable to be lost.
> This example does not implement storage management.

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

#### Wallet 

[provider.js](./frontend/src/app/provider.js) sets up the NEAR wallet selector and wraps the apps pages in the wallet selector context.

#### Main page

[page.js](./frontend/src/app/page.js) this page features all the frontend's components. 

#### Available tokens  

The list of available tokens that the intents infrastructure supports can be fetched by calling the bridge API [CODE](./frontend/src/app/components/TokenSelector.js#L8-L27)


## Further Work
- Migrate to decentralized bridges, support bridges other than POA (direct deposit, aurora, Hot and Omnibridge).
- Add support for signing with non near wallets, there are two ways to do this:
    - Migrate all function calls to signatures (intents already supports this) and add signature verification in the contract.
    - Use foreign wallet connectors that already exist like the bitcoin wallet selector from https://www.satos.network/

Please feel free to contribute these!