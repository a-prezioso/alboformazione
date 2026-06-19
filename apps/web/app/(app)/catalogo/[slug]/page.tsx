import { ContentDetail } from '@/components/ContentDetail';

export const dynamic = 'force-dynamic';

export default async function ContentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { slug } = await params;
  const { ok } = await searchParams;
  return <ContentDetail slug={slug} ok={ok === '1'} section="catalogo" />;
}
