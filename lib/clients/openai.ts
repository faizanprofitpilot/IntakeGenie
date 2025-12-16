import OpenAI from 'openai';
import { ConversationState, IntakeData, AgentResponse } from '@/types';
import { SYSTEM_PROMPT, DEVELOPER_INSTRUCTIONS, STATE_DESCRIPTIONS } from '@/lib/agent/prompts';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY');
}

export const openai = new OpenAI({
  apiKey,
});

export interface ConversationContext {
  state: ConversationState;
  filled: Partial<IntakeData>;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  firmName?: string | null;
}

export async function processAgentTurn(
  context: ConversationContext,
  userUtterance: string
): Promise<AgentResponse> {
  const firmNameContext = context.firmName ? `\n\nFirm name: ${context.firmName}` : '';
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT + '\n\n' + DEVELOPER_INSTRUCTIONS + firmNameContext,
    },
    {
      role: 'system',
      content: `Current state: ${context.state}\nState description: ${STATE_DESCRIPTIONS[context.state] || ''}\nFields collected so far: ${JSON.stringify(context.filled)}${firmNameContext}`,
    },
    ...context.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userUtterance,
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content) as AgentResponse;
    return parsed;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    // Fallback response
    return {
      assistant_say: "I'm sorry, I didn't catch that. Could you repeat?",
      next_state: context.state,
      updates: {},
      done: false,
    };
  }
}

