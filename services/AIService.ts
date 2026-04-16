import { apiClient } from './apiClient';

/**
 * Service specifically for Language Models (Anthropic, Groq).
 * Encapsulates the API keys and endpoints locally to abstract logic from UI components.
 */
class AIService {
  private readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  // Array of valid API keys for rotation fallback to prevent rate limits
  private apiKeys: string[] = [];

  constructor() {
    this.apiKeys = [
      process.env.EXPO_PUBLIC_GROQ_API_KEY_1 || '',
      process.env.EXPO_PUBLIC_GROQ_API_KEY_2 || '',
      process.env.EXPO_PUBLIC_GROQ_API_KEY_3 || '',
    ].filter(key => key !== ''); // Remove empty configs
  }

  /**
   * Helper to fetch a valid key for the transaction.
   */
  private getValidKey(): string {
    if (this.apiKeys.length === 0) {
      throw new Error('API Configuration Error: No Groq API keys present in environment variables.');
    }
    // Simple rotation: Randomly select a key
    const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
    return this.apiKeys[randomIndex];
  }

  /**
   * Primary method for summarization feature.
   * @param text The input raw text.
   * @param depth The configuration string ('quick', 'detailed', 'expert').
   */
  public async summarizeDocument(text: string, depth: string): Promise<string> {
    const key = this.getValidKey();
    
    let prompt = `Summarize the following text. Make it comprehensive.`;
    if (depth === 'quick') prompt = 'Provide a brief, 3-sentence summary of the main points.';
    if (depth === 'detailed') prompt = 'Provide a structured, detailed summary with bullet points summarizing the core information.';
    
    try {
       const response = await apiClient.post(
         this.GROQ_API_URL, 
         {
           model: 'mixtral-8x7b-32768',
           messages: [
             { role: 'system', content: prompt },
             { role: 'user', content: text }
           ],
           temperature: 0.3,
         },
         {
           headers: { Authorization: `Bearer ${key}` }
         }
       );
       
       if (!response.data?.choices?.[0]?.message?.content) {
         throw new Error("Invalid response structural format from Provider.");
       }
       return response.data.choices[0].message.content;
    } catch (error: any) {
       // Allow ErrorBoundary or calling function to parse the error
       throw new Error(`Summary generation failed: ${error.message}`);
    }
  }
}

export const aiService = new AIService();
