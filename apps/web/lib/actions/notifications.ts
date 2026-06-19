'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { db, notifications } from '@alboformazione/db';
import { and, eq } from 'drizzle-orm';

export async function markAllRead() {
  const user = await getCurrentUser();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  revalidatePath('/notifiche');
  revalidatePath('/', 'layout');
}

export async function markRead(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get('id') ?? '');
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  revalidatePath('/notifiche');
  revalidatePath('/', 'layout');
}
