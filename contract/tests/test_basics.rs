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
    let mt_contract = sandbox.dev_deploy(&mt_wasm).await?;

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


    let supply: Balance = 1000u128;
    // Create a new token
    res = mt_admin
        .call(mt_contract.id(), "mt_mint")
        .args_json(json!({
            "token_owner_id": mt_admin.id(),
            "token_metadata": token_metadata,
            "supply": supply 
        }))
        .deposit(NearToken::from_near(1)) // Attach some NEAR for storage
        .transact()
        .await?;

    assert!(res.is_success(), "Token minting failed {:?}", res);

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