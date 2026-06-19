import { NextResponse } from 'next/server';
import { buildInfo } from '@alboformazione/config';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'alboformazione', build: buildInfo });
}
