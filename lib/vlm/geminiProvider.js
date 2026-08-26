/**
 * Gemini Provider — Implementation of VLMProvider using Google Gemini 2.0 Flash.
 * Handles multimodal inputs (redacted text + screenshots) and outputs structured JSON actions.
 * Falls back to local smart-simulation if API key is missing.
 */

import { GoogleGenAI } from '@google/genai';
import { VLMProvider } from './provider';
import { ACTION_TYPES } from '@/lib/utils/constants';

export class GeminiProvider extends VLMProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    super();
    this.apiKey = apiKey;
    this.modelName = 'gemini-2.5-flash';
    
    if (this.apiKey) {
      // In @google/genai SDK, initialization is:
      // const ai = new GoogleGenAI({ apiKey })
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.warn('[GeminiProvider] No API key detected. Running in Smart Mock Simulation mode.');
      this.ai = null;
    }
  }

  async analyze(minimumContext, userCommand) {
    if (!this.ai) {
      return this._simulateResponse(minimumContext, userCommand);
    }

    const start = performance.now();
    try {
      // Prepare text context prompt
      const systemPrompt = `You are an autonomous web-agent executing user actions on a webpage.
The user wants you to achieve the following goal: "${userCommand}".

The page context has been sanitized locally on the user's device before transmission:
- Personal information is replaced with placeholder tokens (e.g., [PERSON_NAME], [PHONE_NUMBER]).
- Highly sensitive information (passwords, government IDs) has been completely blocked and replaced with tokens like [BLOCKED_PASSWORD].
- If you need to fill out a field that has a placeholder, use standard dummy values (e.g., "Jane Doe" for [PERSON_NAME], "9999999999" for [PHONE_NUMBER]).

Analyze the page structure, elements, and interactive fields.
Output your next action as a strictly formatted JSON object with no markdown formatting other than raw JSON.
Action types:
- click: { "type": "click", "target": "CSS_SELECTOR" }
- type: { "type": "type", "target": "CSS_SELECTOR", "value": "VALUE_TO_INPUT" }
- select: { "type": "select", "target": "CSS_SELECTOR", "value": "OPTION_VALUE" }
- scroll: { "type": "scroll", "direction": "down"|"up", "amount": pixels }
- wait: { "type": "wait", "duration": ms }

JSON Schema format:
{
  "action": {
    "type": "click" | "type" | "select" | "scroll" | "wait",
    "target": "CSS_SELECTOR",
    "value": "VALUE_OR_NULL",
    "confidence": 0.0 to 1.0
  },
  "reasoning": "Brief explanation of your decision"
}`;

      const domString = JSON.stringify(minimumContext.dom, null, 2);
      const userPrompt = `Page Context Mode: ${minimumContext.contextMode}
User Command: "${userCommand}"

Semantic DOM Tree:
${domString}`;

      const contents = [userPrompt];

      // Add visual context if present
      if (minimumContext.screenshot && minimumContext.contextMode.includes('screenshot')) {
        const base64Data = minimumContext.screenshot.replace(/^data:image\/\w+;base64,/, '');
        contents.unshift({
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        });
      }

      // Call Gemini API using @google/genai SDK structure
      // response = await ai.models.generateContent({ model, contents, config: { systemInstruction, responseMimeType: "application/json" } })
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      const result = JSON.parse(responseText);

      return {
        action: result.action || { type: 'wait', target: null, value: null, confidence: 0.1 },
        reasoning: result.reasoning || 'Executed default wait command.',
        confidence: result.action?.confidence || 0.5,
        latencyMs: Math.round(performance.now() - start),
      };
    } catch (error) {
      console.error('[GeminiProvider] Error calling VLM:', error);
      return {
        action: { type: 'wait', target: null, value: null, confidence: 0 },
        reasoning: `Error communicating with Gemini VLM: ${error.message}`,
        confidence: 0,
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Smart mock simulation when VLM API key is missing.
   * Maps user commands to logical browser actions based on active scenarios.
   */
  async _simulateResponse(minimumContext, userCommand) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate networking delay
    
    const command = userCommand.toLowerCase();
    let action = { type: 'wait', target: null, value: null, confidence: 0.9 };
    let reasoning = 'Default standby wait action.';

    // Rule-based mapping to simulate VLM understanding for the demo portal
    if (command.includes('click') || command.includes('select') || command.includes('choose')) {
      if (command.includes('update') || command.includes('profile')) {
        action = { type: 'click', target: '#update-profile', value: null, confidence: 0.95 };
        reasoning = 'Clicking Update Profile button to update user registration.';
      } else if (command.includes('submit') || command.includes('application')) {
        action = { type: 'click', target: '#submit-application', value: null, confidence: 0.95 };
        reasoning = 'Clicking Submit Application button to finalize form processing.';
      } else if (command.includes('download') || command.includes('document')) {
        action = { type: 'click', target: '#download-docs', value: null, confidence: 0.9 };
        reasoning = 'Downloading personal verification documents.';
      } else if (command.includes('fund') || command.includes('transfer')) {
        action = { type: 'click', target: '#fund-transfer', value: null, confidence: 0.95 };
        reasoning = 'Selecting Fund Transfer button to open transaction screen.';
      } else if (command.includes('compare')) {
        action = { type: 'click', target: '#compare', value: null, confidence: 0.95 };
        reasoning = 'Initiating product side-by-side specs comparison.';
      } else if (command.includes('add') || command.includes('cart')) {
        action = { type: 'click', target: '#add-to-cart', value: null, confidence: 0.92 };
        reasoning = 'Adding selected wireless headphones to checkout cart.';
      } else if (command.includes('buy') || command.includes('now')) {
        action = { type: 'click', target: '#buy-now', value: null, confidence: 0.95 };
        reasoning = 'Opening checkout page to complete headphone purchase.';
      } else if (command.includes('verify') || command.includes('identity')) {
        action = { type: 'click', target: '#verify-identity', value: null, confidence: 0.95 };
        reasoning = 'Submitting identification card numbers for check.';
      }
    } 
    
    else if (command.includes('type') || command.includes('enter') || command.includes('fill') || command.includes('search')) {
      if (command.includes('password')) {
        action = { type: 'type', target: '#field-login-security-0', value: 'secretpass123', confidence: 0.95 };
        reasoning = 'Entering credential password into login input field.';
      } else if (command.includes('otp')) {
        action = { type: 'type', target: '#field-login-security-1', value: '982741', confidence: 0.95 };
        reasoning = 'Entering received 6-digit authentication OTP.';
      } else if (command.includes('search')) {
        const query = userCommand.match(/(?:for|search)\s+([^"]+)/i)?.[1] || 'headphones';
        action = { type: 'type', target: '#search-input', value: query, confidence: 0.95 };
        reasoning = `Entering search query "${query}" into product search bar.`;
      } else if (command.includes('aadhaar')) {
        action = { type: 'type', target: '#fake-0', value: '483278912345', confidence: 0.9 };
        reasoning = 'Entering Aadhaar card identification details.';
      } else if (command.includes('pan')) {
        action = { type: 'type', target: '#fake-1', value: 'ABCPK1234M', confidence: 0.9 };
        reasoning = 'Entering Permanent Account Number verification.';
      }
    } 
    
    else if (command.includes('scroll') || command.includes('down') || command.includes('up')) {
      const direction = command.includes('up') ? 'up' : 'down';
      action = { type: 'scroll', target: null, direction, amount: 400, confidence: 0.95 };
      reasoning = `Scrolling browser viewport ${direction} to reveal more layout content.`;
    }

    return {
      action,
      reasoning: `[Smart Mock Mode] ${reasoning}`,
      confidence: action.confidence,
      latencyMs: 120,
    };
  }
}
