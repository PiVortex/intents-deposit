export async function GET() {
  const DEFUSE_ENDPOINT = "https://bridge.chaindefuser.com/rpc"

  try {
    const response = await fetch(DEFUSE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "id": 1,
        "jsonrpc": "2.0",
        "method": "supported_tokens",
        "params": [
          {
            "chains": [], 
          }
        ]
      }),
    })

    const data = await response.json()
    const originalTokens = data.result.tokens;
    console.log('Original tokens count:', originalTokens.length);
    
    // Log all asset identifiers to check for duplicates
    const identifiers = originalTokens.map(token => token.defuse_asset_identifier);
    console.log('All identifiers:', identifiers);
    
    // Remove duplicates based on asset identifier
    const uniqueTokens = originalTokens.reduce((acc, current) => {
      const exists = acc.find(item => item.defuse_asset_identifier === current.defuse_asset_identifier);
      if (!exists) {
        acc.push(current);
      } else {
        console.log('Found duplicate:', current.defuse_asset_identifier);
      }
      return acc;
    }, []);

    console.log('Unique tokens count:', uniqueTokens.length);
    console.log('Removed duplicates:', originalTokens.length - uniqueTokens.length);

    return Response.json(uniqueTokens)
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    )
  }
} 