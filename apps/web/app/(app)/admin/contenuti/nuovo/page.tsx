import { ContentEditor } from '@/components/admin/ContentEditor';
import { Breadcrumb } from '@/components/Breadcrumb';

export const dynamic = 'force-dynamic';

export default function NuovoContenutoPage() {
  return (
    <div className="stack">
      <div>
        <Breadcrumb items={[{ label: 'Contenuti', href: '/admin/contenuti' }, { label: 'Nuovo contenuto' }]} />
        <h1 className="page-title" style={{ marginTop: 6 }}>
          Nuovo contenuto
        </h1>
      </div>
      <ContentEditor />
    </div>
  );
}
