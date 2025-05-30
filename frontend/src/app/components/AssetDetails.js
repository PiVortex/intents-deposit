'use client';

export default function AssetDetails({ asset }) {
  if (!asset) return null;

  return (
    <div className="bg-indigo-50 shadow-lg rounded-lg p-6 border-2 border-indigo-100">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600">Selected Asset Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Asset Name</p>
          <p className="font-medium text-gray-700">{asset.asset_name}</p>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Asset Identifier</p>
          <p className="font-medium text-gray-700">{asset.defuse_asset_identifier}</p>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Decimals</p>
          <p className="font-medium text-gray-700">{asset.decimals}</p>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Min Deposit</p>
          <p className="font-medium text-gray-700">{asset.min_deposit_amount}</p>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Min Withdrawal</p>
          <p className="font-medium text-gray-700">{asset.min_withdrawal_amount}</p>
        </div>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Withdrawal Fee</p>
          <p className="font-medium text-gray-700">{asset.withdrawal_fee}</p>
        </div>
      </div>
    </div>
  );
} 