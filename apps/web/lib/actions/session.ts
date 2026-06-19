'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DEMO_PROFILE_COOKIE } from '@/lib/profiles';

export async function setDemoProfile(formData: FormData) {
  const key = String(formData.get('profile') ?? '');
  const c = await cookies();
  if (!key || key === 'self') {
    c.delete(DEMO_PROFILE_COOKIE);
  } else {
    c.set(DEMO_PROFILE_COOKIE, key, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  revalidatePath('/', 'layout');
}
