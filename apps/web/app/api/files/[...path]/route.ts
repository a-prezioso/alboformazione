import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { env } from '@alboformazione/config';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const dir = env().UPLOAD_DIR;
  // Prevent path traversal.
  const rel = normalize(path.join('/')).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = join(dir, rel);
  try {
    await stat(full);
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const ext = full.split('.').pop()?.toLowerCase() ?? '';
  const buf = await readFile(full);
  return new NextResponse(buf, {
    headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=3600' }
  });
}
