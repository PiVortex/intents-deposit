use near_sdk::json_types::U128;
use near_sdk::near;
use near_workspaces::result::ExecutionFinalResult;
use near_workspaces::types::{AccountId, Gas, NearToken};
use near_workspaces::{Account, Contract};
use serde_json::json;
use serde::Serialize;
use near_sdk_v4::Balance;

#[near]
#[derive(Serialize)]
pub struct TokenMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub media: Option<String>,
    pub media_hash: Option<String>,
    pub issued_at: Option<String>,
    pub expires_at: Option<String>,
    pub starts_at: Option<String>,
    pub updated_at: Option<String>,
    pub extra: Option<String>,
    pub reference: Option<String>,
    pub reference_hash: Option<String>,
}

const TEN_NEAR: NearToken = NearToken::from_near(10);
const MT_WASM_FILEPATH: &str = "./tests/multi_token.wasm";


#[tokio::test]
async fn test_contract_is_operational() -> Result<(), Box<dyn std::error::Error>> {
    let sandbox = near_workspaces::sandbox().await?;
    let root: near_workspaces::Account = sandbox.root_account()?;

    // Create accounts
    let alice = create_subaccount(&root, "alice").await?;
    let bob = create_subaccount(&root, "bob").await?;
    let contract_account = create_subaccount(&root, "contract").await?;
    let mt_contract_account = create_subaccount(&root, "mt").await?;
    let mt_admin = create_subaccount(&root, "mt_admin").await?;

    // Deploy the contract
    let contract_wasm = near_workspaces::compile_project("./").await?;
    // let contract_wasm = std::fs::read("./target/near/contract.wasm")?;
    let contract = contract_account.deploy(&contract_wasm).await?.unwrap();

    // Initialize the contract
    let mut res: ExecutionFinalResult = contract
        .call("new")
        .args_json(
                json!({"intents_contract_id": mt_contract_account.id() }),
        )
        .transact()
        .await?;

    assert!(res.is_success(), "Contract initialization failed {:?}", res);

    // Deploy the intents contract
    let mt_wasm = std::fs::read(MT_WASM_FILEPATH)?;
    let mt_contract = mt_contract_account.deploy(&mt_wasm).await?.unwrap();

    // Initialize the token contract with mt_admin as owner
    res = mt_contract
        .call("new_default_meta")
        .args_json(json!({
            "owner_id": mt_admin.id()
        }))
        .transact()
        .await?;

    assert!(res.is_success(), "MT contract initialization failed {:?}", res);

    let token_metadata = TokenMetadata  {
        title: Some("My Token".to_string()),
        description: None,
        media: None,
        media_hash: None,
        issued_at: None,
        expires_at: None,
        starts_at: None,
        updated_at: None,
        extra: None,
        reference: None,
        reference_hash: None,
    };

    // Create a new token
    let supply: Balance = 1000u128;
    res = mt_admin
        .call(mt_contract.id(), "mt_mint")
        .args_json(json!({
            "token_owner_id": mt_admin.id(),
            "token_metadata": token_metadata,
            "supply": supply 
        }))
        .deposit(NearToken::from_near(1)) 
        .transact()
        .await?;

        
    assert!(res.is_success(), "Token minting failed {:?}", res);

    // Register accounts in mt contract and send tokens to them
    for account in [
        alice.clone(),
        bob.clone(),
        contract_account.clone(),
    ]
    .iter()
    {
        let register = account
            .call(mt_contract.id(), "register")
            .args_json(serde_json::json!({"token_id": "1", "account_id": account.id() }))
            .transact()
            .await?;

        assert!(register.is_success(), "Account registration failed {:?}", register);

        // Don't send tokens to the contract account
        if account.id() == contract_account.id() {
            continue;
        }

        let transfer = mt_admin
            .call(mt_contract.id(), "mt_transfer")
            .args_json(serde_json::json!({"token_id": "1", "receiver_id": account.id(), "amount": "100" }))
            .deposit(NearToken::from_yoctonear(1))
            .transact()
            .await?;

        assert!(transfer.is_success(), "Token transfer failed {:?}", transfer);
    }

    // Alice deposits 50 tokens in the contract
    res = alice
        .call(mt_contract.id(), "mt_transfer_call")
        .args_json(serde_json::json!({
            "receiver_id": contract.id(),
            "token_id": "1",
            "amount": "50",
            "msg": "Random message"
        }))
        .deposit(NearToken::from_yoctonear(1))
        .gas(Gas::from_tgas(100))
        .transact()
        .await?;

    assert!(res.is_success(), "Token transfer failed {:?}", res);

    // Check if the contract has received the tokens
    let balance = contract_account
        .call(mt_contract.id(), "mt_balance_of")
        .args_json(serde_json::json!({"account_id": contract_account.id(), "token_id": "1"}))
        .transact()
        .await?;

    let balance_value: String = balance.json()?;
    assert_eq!(balance_value, "50", "Expected balance to be 50, got {}", balance_value);

    let tokens = contract_account
        .call(contract.id(), "get_tokens_for_account")
        .args_json(serde_json::json!({
            "account": contract_account.id(),
            "from_index": null,
            "limit": null
        }))
        .transact()
        .await?;

    let tokens_value: Vec<(String, String)> = tokens.json()?;
    println!("Tokens for contract: {:?}", tokens_value);

    Ok(())
}


async fn create_subaccount(
    root: &near_workspaces::Account,
    name: &str,
) -> Result<near_workspaces::Account, Box<dyn std::error::Error>> {
    let subaccount = root
        .create_subaccount(name)
        .initial_balance(TEN_NEAR)
        .transact()
        .await?
        .unwrap();

    Ok(subaccount)
}