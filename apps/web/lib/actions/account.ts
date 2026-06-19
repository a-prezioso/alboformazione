'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { db, memberDetails } from '@alboformazione/db';

export async function saveMemberDetails(formData: FormData) {
  const user = await getCurrentUser();
  const values = {
    userId: user.id,
    fiscalCode: String(formData.get('fiscalCode') ?? '') || null,
    profession: String(formData.get('profession') ?? '') || null,
    registrationNumber: String(formData.get('registrationNumber') ?? '') || null,
    phone: String(formData.get('phone') ?? '') || null,
    city: String(formData.get('city') ?? '') || null,
    updatedAt: new Date()
  };
  await db
    .insert(memberDetails)
    .values(values)
    .onConflictDoUpdate({ target: memberDetails.userId, set: values });
  revalidatePath('/account');
  redirect('/account?saved=1');
}
