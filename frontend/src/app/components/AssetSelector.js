'use client';

export default function AssetSelector({ tokens, onAssetSelect }) {
  // Group tokens by asset name
  const groupedTokens = tokens.reduce((acc, token) => {
    const name = token.asset_name;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(token);
    return acc;
  }, {});

  return (
    <div className="mb-6">
      <select
        id="asset-select"
        onChange={(event) => {
          const [name, identifier] = event.target.value.split('|');
          const selectedToken = tokens.find(token => 
            token.asset_name === name && 
            token.defuse_asset_identifier === identifier
          );
          onAssetSelect(selectedToken);
        }}
        className="block w-full max-w-xs px-3 py-2 bg-white border-2 border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
      >
        <option value="">Select an asset...</option>
        {Object.entries(groupedTokens).map(([name, tokens]) => (
          <optgroup key={name} label={name}>
            {tokens.map((token) => {
              // Extract chain from identifier (e.g., "eth:1" from "eth:1:0x...")
              const chain = token.defuse_asset_identifier.split(':').slice(0, 2).join(':');
              return (
                <option 
                  key={token.defuse_asset_identifier} 
                  value={`${name}|${token.defuse_asset_identifier}`}
                >
                  {chain}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </div>
  );
} 