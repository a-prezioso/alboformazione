import { env } from '@alboformazione/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Minimal OpenAI-compatible client against the internal AI Gateway
 * (tenant `alboformazione`). Used for AI-assist features (e.g. drafting
 * unlock-test questions in the backoffice). Falls back to a deterministic
 * stub when no API key is configured (POC / local dev).
 */
export async function chat(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<string> {
  const e = env();
  if (!e.AI_GATEWAY_API_KEY) {
    return '[AI non configurata in questo ambiente]';
  }
  const res = await fetch(`${e.AI_GATEWAY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': e.AI_GATEWAY_API_KEY
    },
    body: JSON.stringify({
      model: opts?.model ?? 'qwen3.5:35b',
      temperature: opts?.temperature ?? 0.3,
      messages
    })
  });
  if (!res.ok) {
    throw new Error(`AI Gateway error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}
