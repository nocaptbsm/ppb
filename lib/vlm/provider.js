/**
 * VLM Provider — Abstract interface for remote Vision-Language Models.
 * Ensures the agent system is model-agnostic (swappable with Gemini, OpenAI, Ollama, etc.)
 */

export class VLMProvider {
  /**
   * Analyze the sanitized webpage context and user command to determine the next browser action.
   * 
   * @param {Object} minimumContext - Sanitized structural & visual context from the client
   * @param {string} userCommand - Natural language command issued by the user
   * @returns {Promise<{ action: Object, reasoning: string, confidence: number }>}
   */
  async analyze(minimumContext, userCommand) {
    throw new Error('VLMProvider.analyze() must be implemented');
  }
}
