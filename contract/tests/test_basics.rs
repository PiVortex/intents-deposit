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
    mint_token,
};

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
    let mut res = contract
        .call("new")
        .args_json(json!({"intents_contract_id": mt_contract_account.id() }))
        .transact()
        .await?;

    assert!(res.is_success(), "Contract initialization failed {:?}", res);

    // Deploy the MT contract
    let mt_wasm = std::fs::read(MT_WASM_FILEPATH)?;
    let mt_contract = mt_contract_account.deploy(&mt_wasm).await?.unwrap();

    // Initialize the MT contract with mt_admin as owner
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

    // Mint two tokens
    mint_token(&mt_admin, &mt_contract, "Token 1", 1000).await?;
    mint_token(&mt_admin, &mt_contract, "Token 2", 1000).await?;

    // Deploy another MT contract
    let faulty_mt_contract_account = create_subaccount(&root, "faulty_mt").await?;
    let faulty_mt_wasm = std::fs::read(MT_WASM_FILEPATH)?;
    let faulty_mt_contract = faulty_mt_contract_account.deploy(&faulty_mt_wasm).await?.unwrap();

    // Initialize the faulty MT contract with mt_admin as owner
    res = faulty_mt_contract
        .call("new_default_meta")
        .args_json(json!({
            "owner_id": mt_admin.id()
        }))
        .transact()
        .await?;

    assert!(
        res.is_success(),
        "Faulty MT contract initialization failed {:?}",
        res
    );

    // Mint a token in the faulty MT contract
    mint_token(&mt_admin, &faulty_mt_contract, "Faulty Token", 1000).await?;

    // Register accounts for all tokens in both MT contracts
    for account in [alice.clone(), bob.clone(), contract_account.clone()].iter() {
        // Register for both tokens in the main MT contract
        register_account(account, &mt_contract, "1").await?;
        register_account(account, &mt_contract, "2").await?;

        // Register for the token in the faulty MT contract
        register_account(account, &faulty_mt_contract, "1").await?;

        // Don't send tokens to the contract account
        if account.id() == contract_account.id() {
            continue;
        }

        // Transfer both tokens in the main MT contract
        transfer_tokens(&mt_admin, &mt_contract, account.id(), "1", "100").await?;
        transfer_tokens(&mt_admin, &mt_contract, account.id(), "2", "100").await?;

        // Transfer the token in the faulty MT contract
        transfer_tokens(&mt_admin, &faulty_mt_contract, account.id(), "1", "100").await?;
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

    let token_1_balance = check_balance(&contract_account, &mt_contract, "1").await?;
    assert_eq!(token_1_balance, "50");

    transfer_call_tokens(
        &alice,
        &mt_contract,
        contract.id(),
        "2",
        "30",
        "Random message",
    )
    .await?;

    let token_2_balance = check_balance(&contract_account, &mt_contract, "2").await?;
    assert_eq!(token_2_balance, "30");

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
    let token_1_balance = check_balance(&contract_account, &mt_contract, "1").await?;
    assert_eq!(token_1_balance, "60");

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

    // Check that contract's balance for token 2 is 0
    let token_2_balance = check_balance(&contract_account, &mt_contract, "2").await?;
    assert_eq!(token_2_balance, "0");

    // Check that Alice has no token 2
    let alice_token_2_balance = get_token_balance_for_account(&contract, &contract_account, &alice.id(), "2").await?;
    assert_eq!(alice_token_2_balance, None);

    // Bob withdraws token 1
    withdraw_token(&contract, &bob, "1").await?;

    // Check that Bob's token balance array is empty
    let bob_tokens = get_tokens_for_account(&contract, &contract_account, &bob.id()).await?;
    assert!(bob_tokens.is_empty(), "Expected Bob's token balance array to be empty after withdrawal, got {:?}", bob_tokens);

    // Try to deposit with the faulty MT token
    transfer_call_tokens(
        &bob,
        &faulty_mt_contract,
        contract.id(),
        "1",
        "10",
        "Random message",
    )
    .await?;

    // Check that the contract's balance for the faulty token is 0
    let contract_faulty_token_balance = get_token_balance_for_account(&contract, &contract_account, &contract_account.id(), "1").await?;
    assert_eq!(contract_faulty_token_balance, None);

    // Check that the contract's token map for the faulty token is empty
    let contract_tokens = get_tokens_for_account(&contract, &contract_account, &bob.id()).await?;
    assert!(contract_tokens.is_empty(), "Expected contract's token map to be empty for faulty token, got {:?}", contract_tokens);

    // TODO test intermediate state

    Ok(())
}
