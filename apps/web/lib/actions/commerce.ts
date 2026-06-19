'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { priceForUser } from '@/lib/access';
import { paymentAdapter } from '@alboformazione/adapters';
import { notify } from '@/lib/notify';
import { db, products, orders, orderItems, entitlements, pathItems, contents, paths } from '@alboformazione/db';
import { eq } from 'drizzle-orm';

/** Create a pending order for a product and go to the simulated checkout. */
export async function createOrder(formData: FormData) {
  const user = await getCurrentUser();
  const productId = String(formData.get('productId') ?? '');
  const product = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!product) throw new Error('Prodotto non trovato');

  const price = priceForUser(product, user.membership);
  const order = (
    await db.insert(orders).values({ userId: user.id, status: 'pending', total: String(price) }).returning()
  )[0];
  await db.insert(orderItems).values({
    orderId: order.id,
    productId: product.id,
    unitPrice: String(price),
    qty: 1
  });

  // Create the (mock) checkout session, then redirect to it.
  await paymentAdapter().createCheckout({
    orderId: order.id,
    amount: price,
    description: product.title
  });
  redirect(`/checkout/${order.id}`);
}

/** Confirm the simulated payment, mark the order paid and grant entitlements. */
export async function confirmOrder(formData: FormData) {
  const user = await getCurrentUser();
  const orderId = String(formData.get('orderId') ?? '');
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order || order.userId !== user.id) throw new Error('Ordine non valido');

  if (order.status !== 'paid') {
    const result = await paymentAdapter().confirm(`chk_${orderId}`);
    if (!result.paid) throw new Error('Pagamento non riuscito');

    await db.update(orders).set({ status: 'paid', paidAt: new Date() }).where(eq(orders.id, orderId));

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const it of items) {
      const product = (await db.select().from(products).where(eq(products.id, it.productId)).limit(1))[0];
      if (!product) continue;
      if (product.kind === 'path' && product.pathId) {
        await db
          .insert(entitlements)
          .values({ userId: user.id, pathId: product.pathId, source: 'purchase', orderId })
          .onConflictDoNothing();
        // Grant access to each content within the path.
        const pis = await db.select().from(pathItems).where(eq(pathItems.pathId, product.pathId));
        for (const pi of pis) {
          await db
            .insert(entitlements)
            .values({ userId: user.id, contentId: pi.contentId, source: 'purchase', orderId })
            .onConflictDoNothing();
        }
      } else if (product.contentId) {
        await db
          .insert(entitlements)
          .values({ userId: user.id, contentId: product.contentId, source: 'purchase', orderId })
          .onConflictDoNothing();
      }
    }
    await notify({
      userId: user.id,
      type: 'acquisto',
      title: 'Acquisto completato',
      body: `Il tuo ordine è stato confermato. Accesso abilitato: trovi il contenuto in "I miei corsi".`,
      link: '/i-miei-corsi',
      email: user.email
    });
  }

  // Land the user directly where they can use what they bought.
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  let target = '/i-miei-corsi?ok=1';
  if (items.length === 1) {
    const product = (await db.select().from(products).where(eq(products.id, items[0].productId)).limit(1))[0];
    if (product?.kind === 'path' && product.pathId) {
      const p = (await db.select({ slug: paths.slug }).from(paths).where(eq(paths.id, product.pathId)).limit(1))[0];
      if (p) target = `/percorsi/${p.slug}`;
    } else if (product?.contentId) {
      const c = (await db.select({ slug: contents.slug }).from(contents).where(eq(contents.id, product.contentId)).limit(1))[0];
      if (c) target = `/catalogo/${c.slug}?ok=1`;
    }
  }

  revalidatePath('/acquisti');
  revalidatePath('/catalogo');
  revalidatePath('/i-miei-corsi');
  redirect(target);
}
