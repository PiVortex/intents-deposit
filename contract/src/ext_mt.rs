use crate::TokenId;
use near_sdk::{ext_contract, AccountId, json_types::U128};

#[allow(dead_code)]
#[ext_contract(mt_contract)]
trait MT {
    fn mt_transfer(&self, receiver_id: AccountId, token_id: TokenId, amount: U128);
}
