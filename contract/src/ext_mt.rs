use near_sdk::{ext_contract, json_types::U128, AccountId};

#[allow(dead_code)]
#[ext_contract(mt_contract)]
trait MT {
    fn mt_transfer(&self, receiver_id: AccountId, token_id: String, amount: U128);
}
