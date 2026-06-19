import 'server-only';
import { db, notifications } from '@alboformazione/db';
import { sendEmail } from '@/lib/mailer';

export interface NotifyInput {
  userId: string;
  type: 'info' | 'acquisto' | 'credito' | 'attestato' | 'evento' | 'cfp';
  title: string;
  body?: string;
  link?: string;
  email?: string; // recipient — for the email-mock log
}

/**
 * Creates an in-app notification and "sends" an email (mock: logged).
 * In production the email branch would dispatch via SMTP (cfr. smtp2go).
 */
export async function notify(input: NotifyInput): Promise<void> {
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null
  });
  if (input.email) {
    await sendEmail(input.email, input.title, input.body ?? input.title);
  }
}
