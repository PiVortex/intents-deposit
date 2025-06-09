use serde_json::json;
mod utils;
use near_workspaces::types::Gas;
use utils::{
    check_balance, create_subaccount, get_token_balance_for_account, get_tokens_for_account,
    mint_token, register_account, transfer_call_tokens, transfer_tokens, withdraw_token,
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
    let faulty_mt_contract_account = create_subaccount(&root, "faulty_mt").await?;
    let mt_admin = create_subaccount(&root, "mt_admin").await?;

    // Deploy the deposit contract
    let contract_wasm = near_workspaces::compile_project("./").await?;
    let contract = contract_account.deploy(&contract_wasm).await?.unwrap();

    // Initialize the deposit contract
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
    res = mint_token(&mt_admin, &mt_contract, "Token 1", 1000).await?;
    assert!(res.is_success(), "Token 1 minting failed {:?}", res);
    res = mint_token(&mt_admin, &mt_contract, "Token 2", 1000).await?;
    assert!(res.is_success(), "Token 2 minting failed {:?}", res);

    // Deploy another MT contract
    let faulty_mt_wasm = std::fs::read(MT_WASM_FILEPATH)?;
    let faulty_mt_contract = faulty_mt_contract_account
        .deploy(&faulty_mt_wasm)
        .await?
        .unwrap();

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
    res = mint_token(&mt_admin, &faulty_mt_contract, "Faulty Token", 1000).await?;
    assert!(res.is_success(), "Faulty Token minting failed {:?}", res);

    // Register accounts for all tokens in both MT contracts
    for account in [alice.clone(), bob.clone(), contract_account.clone()].iter() {
        // Register for both tokens in the main MT contract
        res = register_account(account, &mt_contract, "1").await?;
        assert!(res.is_success(), "Account registration failed {:?}", res);
        res = register_account(account, &mt_contract, "2").await?;
        assert!(res.is_success(), "Account registration failed {:?}", res);

        // Register for the token in the faulty MT contract
        res = register_account(account, &faulty_mt_contract, "1").await?;
        assert!(res.is_success(), "Account registration failed {:?}", res);

        // Don't send tokens to the contract account
        if account.id() == contract_account.id() {
            continue;
        }

        // Transfer both tokens in the main MT contract
        res = transfer_tokens(&mt_admin, &mt_contract, account.id(), "1", "100").await?;
        assert!(res.is_success(), "Token transfer failed {:?}", res);
        res = transfer_tokens(&mt_admin, &mt_contract, account.id(), "2", "100").await?;
        assert!(res.is_success(), "Token transfer failed {:?}", res);

        // Transfer the token in the faulty MT contract
        res = transfer_tokens(&mt_admin, &faulty_mt_contract, account.id(), "1", "100").await?;
        assert!(res.is_success(), "Token transfer failed {:?}", res);
    }

    // Alice deposits both tokens from the main mint contract to the deposit contract
    res = transfer_call_tokens(
        &alice,
        &mt_contract,
        contract.id(),
        "1",
        "50",
        "Random message",
    )
    .await?;
    assert!(res.is_success(), "Token deposit failed {:?}", res);

    let token_1_balance = check_balance(&contract_account, &mt_contract, "1").await?;
    assert_eq!(token_1_balance, "50");

    let alice_token_1_balance = get_token_balance_for_account(&contract, &alice.id(), "1").await?;
    assert_eq!(alice_token_1_balance, Some("50".to_string()));

    res = transfer_call_tokens(
        &alice,
        &mt_contract,
        contract.id(),
        "2",
        "30",
        "Random message",
    )
    .await?;
    assert!(res.is_success(), "Token deposit failed {:?}", res);

    let token_2_balance = check_balance(&contract_account, &mt_contract, "2").await?;
    assert_eq!(token_2_balance, "30");

    let alice_token_2_balance = get_token_balance_for_account(&contract, &alice.id(), "2").await?;
    assert_eq!(alice_token_2_balance, Some("30".to_string()));

    // Check all tokens for Alice in the contract
    let tokens_value = get_tokens_for_account(&contract, &alice.id()).await?;
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
    res = transfer_call_tokens(
        &bob,
        &mt_contract,
        contract.id(),
        "1",
        "10",
        "Random message",
    )
    .await?;
    assert!(res.is_success(), "Token deposit failed {:?}", res);

    // Check updated contract balance for token 1
    let token_1_balance = check_balance(&contract_account, &mt_contract, "1").await?;
    assert_eq!(token_1_balance, "60");

    // Check Bob's tokens in the contract
    let bob_token_1_balance = get_token_balance_for_account(&contract, &bob.id(), "1").await?;
    assert_eq!(bob_token_1_balance, Some("10".to_string()));

    // Alice withdraws token 2
    res = withdraw_token(&contract, &alice, "2").await?;
    assert!(res.is_success(), "Token withdrawal failed {:?}", res);

    // Check that contract's balance for token 2 is 0
    let token_2_balance = check_balance(&contract_account, &mt_contract, "2").await?;
    assert_eq!(token_2_balance, "0");

    // Check that Alice has no token 2
    let alice_token_2_balance = get_token_balance_for_account(&contract, &alice.id(), "2").await?;
    assert_eq!(alice_token_2_balance, None);

    // Try to withdraw token 2 again
    res = withdraw_token(&contract, &alice, "2").await?;
    assert!(res.is_failure(), "Token withdrawal should fail {:?}", res);

    // Bob withdraws token 1
    res = withdraw_token(&contract, &bob, "1").await?;
    assert!(res.is_success(), "Token withdrawal failed {:?}", res);

    // Check that Bob's token balance array is empty
    let bob_tokens = get_tokens_for_account(&contract, &bob.id()).await?;
    assert!(
        bob_tokens.is_empty(),
        "Expected Bob's token balance array to be empty after withdrawal, got {:?}",
        bob_tokens
    );

    // Try to withdraw token 1 again
    res = withdraw_token(&contract, &bob, "1").await?;
    assert!(res.is_failure(), "Token withdrawal should fail {:?}", res);

    // Try to deposit with the faulty MT token
    res = transfer_call_tokens(
        &bob,
        &faulty_mt_contract,
        contract.id(),
        "1",
        "10",
        "Random message",
    )
    .await?;
    assert!(res.is_success(), "Token deposit failed {:?}", res);

    // Check that the contract's balance for the faulty token is 0
    let contract_faulty_token_balance =
        get_token_balance_for_account(&contract, &contract_account.id(), "1").await?;
    assert_eq!(contract_faulty_token_balance, None);

    // Check that the contract's token map for the faulty token is empty
    let contract_tokens = get_tokens_for_account(&contract, &bob.id()).await?;
    assert!(
        contract_tokens.is_empty(),
        "Expected contract's token map to be empty for faulty token, got {:?}",
        contract_tokens
    );

    // Test balance whilst withdrawal is in progress
    res = transfer_call_tokens(
        &alice,
        &mt_contract,
        contract.id(),
        "1",
        "20",
        "Random message",
    )
    .await?;
    assert!(res.is_success(), "Token deposit failed {:?}", res);

    // Spawn the withdrawal operation
    let contract_clone = contract.clone();
    let alice_clone = alice.clone();
    tokio::spawn(async move {
        alice_clone
            .call(contract_clone.id(), "withdraw_token")
            .args_json(serde_json::json!({
                "token_id": "1"
            }))
            .gas(Gas::from_tgas(100))
            .transact()
            .await
    });

    // Check balance over multiple blocks to check its 0 at some point
    let mut balance_found_zero = false;
    for _ in 0..20 {
        sandbox.fast_forward(1).await?;
        let balance_during = get_token_balance_for_account(&contract, &alice.id(), "1").await?;
        if balance_during == Some("0".to_string()) {
            balance_found_zero = true;
            break;
        }
    }
    assert!(
        balance_found_zero,
        "Balance never reached 0 after 20 blocks"
    );

    Ok(())
}
