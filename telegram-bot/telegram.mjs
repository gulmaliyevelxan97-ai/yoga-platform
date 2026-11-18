// Token appears only in the Bot API request URL, never in logs or returned errors.
export function telegramApi(token, {fetcher=fetch} = {}) {
  return async function call(method, data={}) {
    let response, payload;
    try {
      response=await fetcher('https://api.telegram.org/bot'+token+'/'+method,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data),
        signal:AbortSignal.timeout(method==='getUpdates'?40000:10000)
      });
      payload=await response.json();
    } catch {
      throw new Error('Telegram API connection failed');
    }
    if (!response.ok || !payload.ok) {
      const error=new Error('Telegram API rejected the request');
      error.code=payload.error_code || response.status;
      const wait=payload.parameters?.retry_after;
      if (Number.isFinite(wait) && wait>0) error.retryAfter=wait;
      throw error;
    }
    return payload.result;
  };
}
