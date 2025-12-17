/**
 * Build Vapi agent configuration for a law firm
 */
export function buildVapiAgent(firmName: string, customGreeting?: string | null, aiTone?: string, aiKnowledgeBase?: string | null) {
  const greeting = customGreeting 
    ? customGreeting.replace(/{FIRM_NAME}/g, firmName)
    : `Thank you for calling ${firmName}. I'm an automated assistant for the firm. I can't give legal advice, but I can collect details so the firm can follow up. Are you in a safe place to talk right now?`;

  const systemPrompt = `You are a professional legal intake assistant for ${firmName}.

Rules:
- One question at a time
- Short sentences
- Acknowledge before asking
- Never give legal advice
- Collect intake only
- End with a clear next-step expectation${aiKnowledgeBase ? `\n\nFirm context: ${aiKnowledgeBase}` : ''}`;

  return {
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.4,
      maxTokens: 180,
    },
    voice: {
      provider: 'deepgram',
      voiceId: 'aura-asteria-en',
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
    },
    firstMessage: greeting,
    systemPrompt: systemPrompt,
  };
}

