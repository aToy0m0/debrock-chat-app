// app/api/chat/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { StreamingTextResponse, Message } from 'ai';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const buildPromptFromMessages = (messages: Message[]) => {
  const history = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  return `以下はユーザーとの会話履歴です。\n${history}\n\nAssistant:`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages;
    const prompt = buildPromptFromMessages(messages);

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_AGENT_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt,
        max_tokens: 200,
      }),
    });

    const response = await bedrock.send(command);
    const json = JSON.parse(new TextDecoder().decode(response.body));
    const text = json.completions?.[0]?.data?.text || '[No response]';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    console.error('Chat Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
