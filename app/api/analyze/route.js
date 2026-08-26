import { NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/vlm/geminiProvider';
import { scanForInjection } from '@/lib/agent/promptInjectionGuard';

/**
 * POST /api/analyze
 * Receives sanitized context from client → forwards to VLM → returns structured action.
 * This is a stateless pass-through. No context is stored or logged.
 *
 * Body: {
 *   context: { contextMode, dom, screenshot?, metadata },
 *   command: string,
 *   provider: 'gemini' | 'openai' | 'ollama'
 * }
 *
 * Response: {
 *   action: { type, target, value, confidence },
 *   reasoning: string,
 *   latency: number
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { context, command, provider = 'gemini' } = body;

    if (!context || !command) {
      return NextResponse.json(
        { error: 'Missing required fields: context, command' },
        { status: 400 }
      );
    }

    // Phase 4: Prompt Injection Guard
    const injectionCheck = scanForInjection(command, context.dom);
    if (injectionCheck.isSuspicious) {
       return NextResponse.json(
         { 
           error: 'Command blocked by Prompt Injection Guard', 
           detail: injectionCheck.alerts[0].evidence 
         },
         { status: 403 }
       );
    }

    let result;
    
    if (provider === 'gemini') {
      const vlm = new GeminiProvider();
      result = await vlm.analyze(context, command);
    } else {
      return NextResponse.json(
        { error: `Provider ${provider} not implemented yet` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      action: result.action,
      reasoning: result.reasoning,
      latencyMs: result.latencyMs,
      provider,
      contextMode: context.contextMode || 'unknown',
    });
  } catch (err) {
    console.error('[API Analyze] Error:', err);
    return NextResponse.json(
      { error: 'Analysis failed', detail: err.message },
      { status: 500 }
    );
  }
}
