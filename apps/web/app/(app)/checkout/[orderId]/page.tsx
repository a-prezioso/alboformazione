import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { confirmOrder } from '@/lib/actions/commerce';
import { SubmitButton } from '@/components/SubmitButton';
import { Breadcrumb } from '@/components/Breadcrumb';
import { db, orders, orderItems, products } from '@alboformazione/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order || order.userId !== user.id) notFound();

  const items = await db
    .select({ title: products.title, unitPrice: orderItems.unitPrice, qty: orderItems.qty })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderId));

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <div>
        <Breadcrumb items={[{ label: 'Acquisti', href: '/acquisti' }, { label: 'Checkout' }]} />
        <h1 className="page-title" style={{ marginTop: 6 }}>Checkout</h1>
        <p className="muted">Pagamento simulato (POC). In produzione qui interviene il gateway di pagamento.</p>
      </div>
      <div className="card stack">
        {items.map((it, i) => (
          <div className="row between" key={i}>
            <span>{it.title}</span>
            <strong>€ {Number(it.unitPrice).toFixed(2)}</strong>
          </div>
        ))}
        <hr style={{ border: 0, borderTop: '1px solid var(--color-outline-variant, #eee)' }} />
        <div className="row between">
          <span>Totale</span>
          <strong style={{ fontSize: 20 }}>€ {Number(order.total).toFixed(2)}</strong>
        </div>
        {order.status === 'paid' ? (
          <span className="badge success">Ordine già pagato</span>
        ) : (
          <form action={confirmOrder}>
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton className="btn primary block" pendingLabel="Elaboro pagamento…">
              Conferma pagamento
            </SubmitButton>
          </form>
        )}
        <Link href="/acquisti" className="btn ghost small">
          Annulla
        </Link>
      </div>
    </div>
  );
}
