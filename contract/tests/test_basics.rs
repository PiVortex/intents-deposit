use near_sdk::near;
use near_sdk_v4::Balance;
use near_workspaces::result::ExecutionFinalResult;
use near_workspaces::types::{AccountId, Gas, NearToken};
use serde::Serialize;
use serde_json::json;

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

    // Check that Alice's token 2 balance in the contract is now 0
    let alice_tokens = get_tokens_for_account(&contract, &contract_account, &alice.id()).await?;
    assert!(
        alice_tokens.contains(&("2".to_string(), "0".to_string())),
        "Token 2 should be withdrawn"
    );
    assert!(
        alice_tokens.contains(&("1".to_string(), "50".to_string())),
        "Expected only token 1 with balance 50"
    );

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

async fn check_balance(
    account: &near_workspaces::Account,
    mt_contract: &near_workspaces::Contract,
    token_id: &str,
    expected_balance: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let balance = account
        .call(mt_contract.id(), "mt_balance_of")
        .args_json(serde_json::json!({
            "account_id": account.id(),
            "token_id": token_id
        }))
        .transact()
        .await?;
    let balance_value: String = balance.json()?;
    assert_eq!(
        balance_value, expected_balance,
        "Expected balance of token {} to be {}, got {}",
        token_id, expected_balance, balance_value
    );
    Ok(())
}

async fn register_account(
    account: &near_workspaces::Account,
    mt_contract: &near_workspaces::Contract,
    token_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let register = account
        .call(mt_contract.id(), "register")
        .args_json(serde_json::json!({
            "token_id": token_id,
            "account_id": account.id()
        }))
        .transact()
        .await?;
    assert!(
        register.is_success(),
        "Account registration for token {} failed {:?}",
        token_id,
        register
    );
    Ok(())
}

async fn transfer_tokens(
    sender: &near_workspaces::Account,
    mt_contract: &near_workspaces::Contract,
    receiver_id: &AccountId,
    token_id: &str,
    amount: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let transfer = sender
        .call(mt_contract.id(), "mt_transfer")
        .args_json(serde_json::json!({
            "token_id": token_id,
            "receiver_id": receiver_id,
            "amount": amount
        }))
        .deposit(NearToken::from_yoctonear(1))
        .transact()
        .await?;
    assert!(
        transfer.is_success(),
        "Token {} transfer failed {:?}",
        token_id,
        transfer
    );
    Ok(())
}

async fn transfer_call_tokens(
    sender: &near_workspaces::Account,
    mt_contract: &near_workspaces::Contract,
    receiver_id: &AccountId,
    token_id: &str,
    amount: &str,
    msg: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let res = sender
        .call(mt_contract.id(), "mt_transfer_call")
        .args_json(serde_json::json!({
            "receiver_id": receiver_id,
            "token_id": token_id,
            "amount": amount,
            "msg": msg
        }))
        .deposit(NearToken::from_yoctonear(1))
        .gas(Gas::from_tgas(100))
        .transact()
        .await?;
    assert!(
        res.is_success(),
        "Token {} transfer_call failed {:?}",
        token_id,
        res
    );
    Ok(())
}

async fn get_tokens_for_account(
    contract: &near_workspaces::Contract,
    account: &near_workspaces::Account,
    target_account: &AccountId,
) -> Result<Vec<(String, String)>, Box<dyn std::error::Error>> {
    let tokens = account
        .call(contract.id(), "get_tokens_for_account")
        .args_json(serde_json::json!({
            "account": target_account,
            "from_index": null,
            "limit": null
        }))
        .transact()
        .await?;

    let tokens_value: Vec<(String, String)> = tokens.json()?;
    Ok(tokens_value)
}

async fn withdraw_token(
    contract: &near_workspaces::Contract,
    account: &near_workspaces::Account,
    token_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let withdraw = account
        .call(contract.id(), "withdraw_token")
        .args_json(serde_json::json!({
            "token_id": token_id
        }))
        .gas(Gas::from_tgas(100))
        .transact()
        .await?;
    assert!(
        withdraw.is_success(),
        "Token withdrawal failed {:?}",
        withdraw
    );
    Ok(())
}
