'use client';

export default function AssetDetails({ asset }) {
  if (!asset) return null;

  return (
    <details className="bg-indigo-50 shadow-lg rounded-lg border-2 border-indigo-100 group">
      <summary className="p-6 cursor-pointer flex items-center justify-between">
        <h2 className="text-xl font-semibold text-indigo-600">Selected Asset Details</h2>
        <svg 
          className="w-6 h-6 text-indigo-600 transform transition-transform duration-200 group-open:rotate-180" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="p-6 pt-0 space-y-3">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Asset Name</p>
          <p className="font-medium text-gray-700 mt-1">{asset.asset_name}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Asset Identifier</p>
          <p className="font-medium text-gray-700 mt-1 break-all">{asset.defuse_asset_identifier}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">NEAR Token Identifier</p>
          <p className="font-medium text-gray-700 mt-1 break-all">{asset.near_token_id}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Decimals</p>
          <p className="font-medium text-gray-700 mt-1">{asset.decimals}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Min Deposit</p>
          <p className="font-medium text-gray-700 mt-1">{asset.min_deposit_amount}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Min Withdrawal</p>
          <p className="font-medium text-gray-700 mt-1">{asset.min_withdrawal_amount}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <p className="text-sm text-indigo-500">Withdrawal Fee</p>
          <p className="font-medium text-gray-700 mt-1">{asset.withdrawal_fee}</p>
        </div>
      </div>
    </details>
  );
} 