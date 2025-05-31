use near_sdk::{log, near, AccountId, PromiseOrValue, require, env, PanicOnDefault, BorshStorageKey};
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::json_types::U128;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    intents_contract_id: AccountId,
    balances: LookupMap<AccountId, IterableMap<TokenId, u128>>
}

#[derive(BorshStorageKey)]
#[near]
pub enum StorageKey {
    Balances,
}

pub type TokenId = AccountId;

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

    pub fn mt_on_transfer(
        &mut self,
        sender_id: AccountId,
        previous_owner_ids: Vec<AccountId>,
        token_ids: Vec<TokenId>,
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

        require!(
            amount.0 > 0,
            "Amount must be greater than 0"
        );

        let tokens = self.get_or_create_token_map(previous_owner_id.clone());
        tokens.insert(token_id.clone(), amount.0);

        log!("Deposited {} of token {}", amount.0, token_id);

        PromiseOrValue::Value(vec![U128(0)])
    }

    pub fn withdraw_all(&mut self, account: AccountId, token: TokenId) {
        // TODO
    }
    
    pub fn get_tokens_for_account(&self, account: AccountId, from_index: &Option<u32>, limit: &Option<u32>) -> Vec<(TokenId, U128)> {
        if let Some(balance) = self.balances.get(&account) {
            let from = from_index.unwrap_or(0);
            let limit = limit.unwrap_or(balance.len() as u32);
            
            balance.iter()
                .skip(from as usize)
                .take(limit as usize)
                .map(|(token, amount)| (token.clone(), U128::from(*amount)))
                .collect()
        } else {
            Vec::new()
        }
    }

    // Internal helper function
    fn get_or_create_token_map(&mut self, account_id: AccountId) -> &mut IterableMap<TokenId, u128> {
        if !self.balances.contains_key(&account_id) {
            self.balances.insert(account_id.clone(), IterableMap::new(b"t".to_vec()));
        }
        self.balances.get_mut(&account_id).unwrap()
    }
}