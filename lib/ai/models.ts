// Curated list of top models from Vercel AI Gateway
export const DEFAULT_CHAT_MODEL = "provider-5/gemini-2.5-flash-lite";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  // Google
  {
    id: "provider-5/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Ultra fast and affordable",
  },
  {
    id: "provider-5/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Best balance of speed, intelligence, and cost",
  },

  {
    id: "provider-5/gemini-2.5-flash-thinking",
    name: "Gemini 2.5 Flash Thinking",
    provider: "google",
    description: "Enhanced reasoning capabilities",
  },

  // OpenAI
  {
    id: "provider-3/gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    description: "Fast and cost-effective for simple tasks",
  },
  {
    id: "provider-3/gpt-5.1-chat",
    name: "GPT-5.1 Chat",
    provider: "openai",
    description: "Optimized for conversational tasks",
  },

  // minimax
  {
    id: "provider-3/minimax-m2",
    name: "Minimax M2",
    provider: "minimax",
    description: "High-performance model for diverse applications",
  },

  //glm
  {
    id: "provider-3/glm-4.7",
    name: "GLM 4.7",
    provider: "glm",
    description: "Advanced language model with strong reasoning skills",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
