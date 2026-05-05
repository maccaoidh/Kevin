exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // OURA API — GET request with ?type=oura&endpoint=...
    if (event.httpMethod === 'GET') {
      const ouraToken = process.env.OURA_ACCESS_TOKEN;
      if (!ouraToken) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Oura token not configured' }) };
      }
      const endpoint = event.queryStringParameters?.endpoint;
      const start_date = event.queryStringParameters?.start_date;
      const end_date = event.queryStringParameters?.end_date;
      if (!endpoint) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing endpoint parameter' }) };
      }
      const params = new URLSearchParams();
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      const response = await fetch(`https://api.ouraring.com/v2/usercollection/${endpoint}?${params}`, {
        headers: { 'Authorization': `Bearer ${ouraToken}` }
      });
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ANTHROPIC API — POST request
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: body.system,
          messages: body.messages
        })
      });
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
