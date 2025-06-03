use near_sdk::json_types::U128;
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{
    env, log, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise,
    PromiseError, PromiseOrValue,
};
use near_sdk_contract_tools::mt::Nep245Receiver;

pub mod ext_mt;
use crate::ext_mt::*;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    intents_contract_id: AccountId,
    balances: LookupMap<AccountId, IterableMap<String, u128>>,
}

#[derive(BorshStorageKey)]
#[near]
pub enum StorageKey {
    Balances,
}

pub const MT_TRANSFER_GAS: Gas = Gas::from_tgas(10);
pub const CALLBACK_GAS: Gas = Gas::from_tgas(10);

#[near]
impl Nep245Receiver for Contract {
    fn mt_on_transfer(
        &mut self,
        sender_id: AccountId,
        previous_owner_ids: Vec<AccountId>,
        token_ids: Vec<String>,
        amounts: Vec<U128>,
        msg: String,
    ) -> PromiseOrValue<Vec<U128>> {
        let _ = sender_id;
        let _ = msg;

        require!(
            token_ids.len() == 1,
            "This contract only accepts one token at a time"
        );
        require!(
            previous_owner_ids.len() == 1 && amounts.len() == 1,
            "Invalid input length"
        );
        require!(
            env::predecessor_account_id() == self.intents_contract_id,
            "Only accepts the intents.near multi-token contract"
        );

        let token_id = &token_ids[0];
        let previous_owner_id = &previous_owner_ids[0];
        let amount = &amounts[0];

        require!(amount.0 > 0, "Withdrawal in progress, cannot deposit");

        // If the previous owner has no tokens, create a new map for them
        if self.balances.get(previous_owner_id).is_none() {
            let new_map: IterableMap<String, u128> = IterableMap::new(previous_owner_id.as_bytes());
            self.balances.insert(previous_owner_id.clone(), new_map);
        }

        // Get the current balance of the previous owner for the specific token
        let tokens = self.balances.get_mut(previous_owner_id).unwrap();
        let current_amount = tokens.get(token_id).unwrap_or(&0u128);

        // Update the balance of the previous owner for the specific token
        tokens.insert(token_id.clone(), current_amount + amount.0);

        log!("Deposited {} of token {}", amount.0, token_id);

        PromiseOrValue::Value(vec![U128(0)])
    }
}

#[near]
impl Contract {
    #[init]
    #[private]
    pub fn new(intents_contract_id: AccountId) -> Self {
        Self {
            intents_contract_id,
            balances: LookupMap::new(StorageKey::Balances),
        }
    }

    pub fn withdraw_token(&mut self, token_id: String) -> Promise {
        let account_id = env::predecessor_account_id();

        // Update the balance of the account for the specific token to zero
        let tokens = self
            .balances
            .get_mut(&account_id)
            .unwrap_or_else(|| panic!("No tokens found for account"));
        let amount = *tokens.get(&token_id).unwrap_or(&0u128);
        require!(amount > 0, "Token balance is zero");
        tokens.insert(token_id.clone(), 0);

        log!("Withdrawing {} of token {}", amount, token_id);

        // Transfer the full amount of the token to the user
        mt_contract::ext(self.intents_contract_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(MT_TRANSFER_GAS)
            .mt_transfer(account_id.clone(), token_id.clone(), U128(amount))
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(CALLBACK_GAS)
                    .withdraw_callback(token_id, U128(amount), account_id),
            )
    }

    #[private]
    pub fn withdraw_callback(
        &mut self,
        #[callback_result] call_result: Result<U128, PromiseError>,
        token_id: String,
        amount: U128,
        account_id: AccountId,
    ) -> U128 {
        if call_result.is_ok() {
            // Remove the token from the map
            let tokens = self
                .balances
                .get_mut(&account_id)
                .unwrap_or_else(|| panic!("No tokens found for account"));
            tokens.remove(&token_id);

            if tokens.is_empty() {
                self.balances.remove(&account_id);
            }

            log!("Token withdrawal successful");
            return U128(0);
        } else {
            // Restore the balance if withdrawal failed
            let tokens = self
                .balances
                .get_mut(&account_id)
                .unwrap_or_else(|| panic!("No tokens found for account"));
            tokens.insert(token_id.clone(), amount.0);
            log!("Token withdrawal failed");
            return amount;
        }
    }

    pub fn get_tokens_for_account(
        &self,
        account: AccountId,
        from_index: &Option<u32>,
        limit: &Option<u32>,
    ) -> Vec<(String, U128)> {
        if let Some(balance) = self.balances.get(&account) {
            let from = from_index.unwrap_or(0);
            let limit = limit.unwrap_or(balance.len() as u32);

            balance
                .iter()
                .skip(from as usize)
                .take(limit as usize)
                .map(|(token, amount)| (token.clone(), U128::from(*amount)))
                .collect()
        } else {
            Vec::new()
        }
    }
}
