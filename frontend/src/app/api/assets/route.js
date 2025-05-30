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
    return Response.json(data.result.tokens)
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    )
  }
} 