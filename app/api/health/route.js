import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'PrivacyShield Agent',
    version: '1.0.0-mvp',
    timestamp: new Date().toISOString(),
    modules: {
      perception: 'ready',
      privacy: 'ready',
      vlm: process.env.GEMINI_API_KEY ? 'configured' : 'no_api_key',
      firewall: 'ready',
    },
  });
}
