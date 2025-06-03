use near_sdk::near;
use serde::Serialize;
use near_sdk_v4::Balance;
use near_workspaces::types::{AccountId, Gas, NearToken};

const TEN_NEAR: NearToken = NearToken::from_near(10);

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

pub async fn create_subaccount(
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

pub async fn mint_token(
    mt_admin: &near_workspaces::Account,
    mt_contract: &near_workspaces::Contract,
    title: &str,
    supply: Balance,
) -> Result<(), Box<dyn std::error::Error>> {
    let token_metadata = TokenMetadata {
        title: Some(title.to_string()),
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

    let mint = mt_admin
        .call(mt_contract.id(), "mt_mint")
        .args_json(serde_json::json!({
            "token_owner_id": mt_admin.id(),
            "token_metadata": token_metadata,
            "supply": supply
        }))
        .deposit(NearToken::from_near(1))
        .transact()
        .await?;
    assert!(mint.is_success(), "Token minting failed {:?}", mint);
    Ok(())
}

pub async fn check_balance(
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

pub async fn register_account(
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

pub async fn transfer_tokens(
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

pub async fn transfer_call_tokens(
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

pub async fn get_tokens_for_account(
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

pub async fn withdraw_token(
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

pub async fn get_token_balance_for_account(
    contract: &near_workspaces::Contract,
    account: &near_workspaces::Account,
    target_account: &AccountId,
    token_id: &str,
) -> Result<Option<String>, Box<dyn std::error::Error>> {
    let res = account
        .call(contract.id(), "get_token_balance_for_account")
        .args_json(serde_json::json!({
            "account": target_account,
            "token_id": token_id
        }))
        .view()
        .await?;
    let balance: Option<String> = res.json()?;
    Ok(balance)
} 