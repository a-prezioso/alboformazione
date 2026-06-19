import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getCurrentUser, canManage } from '@/lib/auth';
import { env } from '@alboformazione/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!canManage(user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no file' }, { status: 400 });

  const dir = env().UPLOAD_DIR;
  await mkdir(dir, { recursive: true });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${randomUUID().slice(0, 8)}-${safe}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, key), buf);

  return NextResponse.json({ key: `/api/files/${key}`, name: file.name, size: buf.length });
}
