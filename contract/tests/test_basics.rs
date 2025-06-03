use near_sdk::near;
use near_sdk_v4::Balance;
use near_workspaces::result::ExecutionFinalResult;
use near_workspaces::types::NearToken;
use serde::Serialize;
use serde_json::json;
mod utils;
use utils::{
    create_subaccount,
    check_balance,
    register_account,
    transfer_tokens,
    transfer_call_tokens,
    get_tokens_for_account,
    withdraw_token,
    get_token_balance_for_account,
};

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
        .args_json(json!({"intents_contract_id": mt_contract_account.id() }))
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

    assert!(
        res.is_success(),
        "MT contract initialization failed {:?}",
        res
    );

    // After initializing the MT contract, mint two tokens
    let token_metadata_1 = TokenMetadata {
        title: Some("Token 1".to_string()),
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

    let token_metadata_2 = TokenMetadata {
        title: Some("Token 2".to_string()),
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

    // Mint first token
    let supply: Balance = 1000u128;
    res = mt_admin
        .call(mt_contract.id(), "mt_mint")
        .args_json(json!({
            "token_owner_id": mt_admin.id(),
            "token_metadata": token_metadata_1,
            "supply": supply
        }))
        .deposit(NearToken::from_near(1))
        .transact()
        .await?;

    assert!(res.is_success(), "Token 1 minting failed {:?}", res);

    // Mint second token
    res = mt_admin
        .call(mt_contract.id(), "mt_mint")
        .args_json(json!({
            "token_owner_id": mt_admin.id(),
            "token_metadata": token_metadata_2,
            "supply": supply
        }))
        .deposit(NearToken::from_near(1))
        .transact()
        .await?;

    assert!(res.is_success(), "Token 2 minting failed {:?}", res);

    // Register accounts for both tokens
    for account in [alice.clone(), bob.clone(), contract_account.clone()].iter() {
        // Register for both tokens
        register_account(account, &mt_contract, "1").await?;
        register_account(account, &mt_contract, "2").await?;

        // Don't send tokens to the contract account
        if account.id() == contract_account.id() {
            continue;
        }

        // Transfer both tokens
        transfer_tokens(&mt_admin, &mt_contract, account.id(), "1", "100").await?;
        transfer_tokens(&mt_admin, &mt_contract, account.id(), "2", "100").await?;
    }

    // Alice deposits both tokens in the contract
    transfer_call_tokens(
        &alice,
        &mt_contract,
        contract.id(),
        "1",
        "50",
        "Random message",
    )
    .await?;

    transfer_call_tokens(
        &alice,
        &mt_contract,
        contract.id(),
        "2",
        "30",
        "Random message",
    )
    .await?;

    // Check balances for both tokens
    check_balance(&contract_account, &mt_contract, "1", "50").await?;
    check_balance(&contract_account, &mt_contract, "2", "30").await?;

    // Check all tokens for Alice in the contract
    let tokens_value = get_tokens_for_account(&contract, &contract_account, &alice.id()).await?;
    assert_eq!(
        tokens_value.len(),
        2,
        "Expected 2 tokens for Alice, got {}",
        tokens_value.len()
    );
    assert!(
        tokens_value.contains(&("1".to_string(), "50".to_string())),
        "Expected token 1 with balance 50"
    );
    assert!(
        tokens_value.contains(&("2".to_string(), "30".to_string())),
        "Expected token 2 with balance 30"
    );

    // Check token balances for Alice directly from the contract
    let alice_token_1_balance = get_token_balance_for_account(&contract, &contract_account, &alice.id(), "1").await?;
    assert_eq!(alice_token_1_balance, Some("50".to_string()));
    let alice_token_2_balance = get_token_balance_for_account(&contract, &contract_account, &alice.id(), "2").await?;
    assert_eq!(alice_token_2_balance, Some("30".to_string()));

    // Bob sends 10 tokens of token 1 to the contract
    transfer_call_tokens(
        &bob,
        &mt_contract,
        contract.id(),
        "1",
        "10",
        "Random message",
    )
    .await?;

    // Check updated contract balance for token 1
    check_balance(&contract_account, &mt_contract, "1", "60").await?;

    // Check Bob's tokens in the contract
    let bob_tokens = get_tokens_for_account(&contract, &contract_account, &bob.id()).await?;
    assert_eq!(
        bob_tokens.len(),
        1,
        "Expected 1 token for Bob, got {}",
        bob_tokens.len()
    );
    assert!(
        bob_tokens.contains(&("1".to_string(), "10".to_string())),
        "Expected token 1 with balance 10"
    );

    // Alice withdraws token 2
    withdraw_token(&contract, &alice, "2").await?;

    // Check that contract's balance for token 2 has decreased by 30
    check_balance(&contract_account, &mt_contract, "2", "0").await?;

    // Check that Alice has no token 2
    let alice_token_2_balance = get_token_balance_for_account(&contract, &contract_account, &alice.id(), "2").await?;
    assert_eq!(alice_token_2_balance, None);

    // Bob withdraws token 1
    withdraw_token(&contract, &bob, "1").await?;

    // Check that Bob's token balance array is empty
    let bob_tokens = get_tokens_for_account(&contract, &contract_account, &bob.id()).await?;
    assert!(bob_tokens.is_empty(), "Expected Bob's token balance array to be empty after withdrawal, got {:?}", bob_tokens);

    Ok(())
}
