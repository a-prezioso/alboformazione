'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveContent,
  addMaterial,
  deleteMaterial,
  saveQuiz,
  createLiveEvent,
  setContentStatus,
  aiDraftQuiz
} from '@/lib/actions/admin';
import { Uploader } from '@/components/Uploader';
import { SubmitButton } from '@/components/SubmitButton';
import { Icon } from '@/components/Icon';
import type { ContentRow } from '@/lib/data/catalog';

interface Material { id: string; title: string; fileKey: string; kind: string }
interface QuizQ { prompt: string; options: string[]; correctIndex: number }
interface QuizData { passPct: number; questions: QuizQ[] }
interface LiveEv { id: string; startAt: Date | string; joinUrl: string | null; zoomMeetingId: string | null }

type TabKey = 'dati' | 'pubblicazione' | 'materiali' | 'test' | 'eventi';

export function ContentEditor({
  content,
  materials = [],
  quiz,
  liveEvents = []
}: {
  content?: ContentRow;
  materials?: Material[];
  quiz?: QuizData | null;
  liveEvents?: LiveEv[];
}) {
  const c = content;
  const isNew = !c;
  const router = useRouter();
  const [type, setType] = useState(c?.contentType ?? 'ondemand');
  const isLive = type === 'live';
  const activeFrom = c?.creditsActiveFrom ? new Date(c.creditsActiveFrom).toISOString().slice(0, 10) : '';

  const [tab, setTab] = useState<TabKey>('dati');
  const [state, formAction, pending] = useActionState(saveContent, {} as Awaited<ReturnType<typeof saveContent>>);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state?.id) {
      window.location.assign(`/admin/contenuti/${state.id}`);
    } else if (state?.ok) {
      setSaved(true);
      router.refresh();
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  // Same tab bar for create and edit. The non-"Dati" tabs require a saved
  // content, so in create mode they are shown but disabled until you save.
  const tabs: { k: TabKey; label: string; badge?: number; needsSaved?: boolean }[] = [
    { k: 'dati', label: 'Dati' },
    { k: 'pubblicazione', label: 'Pubblicazione', needsSaved: true },
    { k: 'materiali', label: 'Materiali', badge: materials.length || undefined, needsSaved: true },
    { k: 'test', label: 'Test di sblocco', badge: quiz?.questions.length || undefined, needsSaved: true },
    ...(isLive
      ? ([{ k: 'eventi', label: 'Eventi live', badge: liveEvents.length || undefined, needsSaved: true }] as {
          k: TabKey;
          label: string;
          badge?: number;
          needsSaved?: boolean;
        }[])
      : [])
  ];

  return (
    <div className="stack">
      <nav className="tabs" role="tablist">
        {tabs.map((t) => {
          const disabled = isNew && t.needsSaved;
          return (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={tab === t.k}
              disabled={disabled}
              title={disabled ? 'Disponibile dopo la creazione del contenuto' : undefined}
              className={`tab ${tab === t.k ? 'active' : ''}`}
              onClick={() => !disabled && setTab(t.k)}
            >
              {t.label}
              {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      {isNew && (
        <p className="muted small" style={{ marginTop: -4 }}>
          Compila i dati e crea il contenuto: pubblicazione, materiali, test ed eventi live si abilitano
          subito dopo.
        </p>
      )}

      {tab === 'dati' && (
        <form action={formAction} className="card stack">
          {c && <input type="hidden" name="id" value={c.id} />}
          <div className="card-title">Dati del contenuto</div>
          {state?.error && (
            <span className="badge warn" style={{ alignSelf: 'flex-start' }}>{state.error}</span>
          )}
          {saved && (
            <span className="success-note" style={{ alignSelf: 'flex-start', padding: '6px 12px' }}>
              <Icon name="check" size={16} /> Modifiche salvate
            </span>
          )}
          <div className="grid cols-2">
            <div className="field">
              <label>Titolo</label>
              <input className="input" name="title" defaultValue={c?.title ?? ''} required />
            </div>
            <div className="field">
              <label>Slug (URL)</label>
              <input className="input" name="slug" defaultValue={c?.slug ?? ''} placeholder="auto da titolo" />
            </div>
          </div>
          <div className="grid cols-3">
            <div className="field">
              <label>Tipo</label>
              <select className="select" name="contentType" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ondemand">Differita (on-demand)</option>
                <option value="live">Live (videoconferenza)</option>
                <option value="extra">Extra (non certificante)</option>
              </select>
            </div>
            <div className="field">
              <label>Durata (min)</label>
              <input className="input" name="durationMin" type="number" defaultValue={c?.durationMin ?? ''} />
            </div>
            <div className="field">
              <label>Tipo extra (se Extra)</label>
              <input className="input" name="extraKind" defaultValue={c?.extraKind ?? ''} placeholder="intervista…" />
            </div>
          </div>
          <div className="field">
            <label>Sommario</label>
            <input className="input" name="summary" defaultValue={c?.summary ?? ''} />
          </div>
          <div className="field">
            <label>Descrizione</label>
            <textarea className="textarea" name="description" rows={4} defaultValue={c?.description ?? ''} />
          </div>

          <Uploader name="videoKey" label="Video (carica file o lascia la chiave esistente)" accept="video/*" defaultValue={c?.videoKey ?? ''} />

          <div className="card" style={{ background: 'var(--color-surface-alt, #faf9f8)' }}>
            <label className="row" style={{ gap: 8, fontWeight: 600 }}>
              <input type="checkbox" name="certifying" defaultChecked={c?.certifying ?? false} />
              Contenuto certificante (rilascia crediti)
            </label>
            <div className="grid cols-4" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Crediti Live</label>
                <input className="input" name="creditsLive" type="number" step="0.5" defaultValue={Number(c?.creditsLive ?? 0)} />
              </div>
              <div className="field">
                <label>Crediti Differita</label>
                <input className="input" name="creditsOndemand" type="number" step="0.5" defaultValue={Number(c?.creditsOndemand ?? 0)} />
              </div>
              <div className="field">
                <label>% visione minima</label>
                <input className="input" name="minViewPct" type="number" defaultValue={c?.minViewPct ?? 80} />
              </div>
              <div className="field">
                <label>Crediti attivi dal</label>
                <input className="input" name="creditsActiveFrom" type="date" defaultValue={activeFrom} />
              </div>
            </div>
            <p className="muted small">
              «Crediti attivi dal» applica la non retroattività: i crediti in differita valgono solo per i
              contenuti attivati dopo l&apos;avvio del servizio.
            </p>
          </div>

          <span style={{ alignSelf: 'flex-start' }}>
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? 'Salvo…' : isNew ? 'Crea contenuto' : 'Salva modifiche'}
            </button>
          </span>
        </form>
      )}

      {!isNew && tab === 'pubblicazione' && (
        <div className="card stack">
          <div className="card-title">Stato di pubblicazione</div>
          <p className="muted small">Stato attuale: <strong>{c!.status}</strong></p>
          <div className="row">
            {(['draft', 'published', 'archived'] as const).map((st) => (
              <form action={setContentStatus} key={st}>
                <input type="hidden" name="id" value={c!.id} />
                <input type="hidden" name="status" value={st} />
                <button className={`btn ${c!.status === st ? 'primary' : 'outline'}`} type="submit">
                  {st === 'draft' ? 'Bozza' : st === 'published' ? 'Pubblica' : 'Archivia'}
                </button>
              </form>
            ))}
          </div>
          <p className="muted small">Solo i contenuti <strong>pubblicati</strong> sono visibili nel catalogo.</p>
        </div>
      )}

      {!isNew && tab === 'materiali' && (
        <div className="card stack">
          <div className="card-title">Materiali didattici</div>
          {materials.length === 0 ? (
            <p className="muted small">Nessun materiale caricato.</p>
          ) : (
            <ul>
              {materials.map((m) => (
                <li key={m.id} className="row between" style={{ padding: '6px 0' }}>
                  <span>{m.title} <span className="muted small">({m.kind})</span></span>
                  <form action={deleteMaterial}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="contentId" value={c!.id} />
                    <button className="btn ghost small" type="submit">Rimuovi</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addMaterial} className="grid cols-3" style={{ alignItems: 'end' }}>
            <input type="hidden" name="contentId" value={c!.id} />
            <div className="field">
              <label>Titolo materiale</label>
              <input className="input" name="title" required />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="select" name="kind">
                <option value="document">Documento</option>
                <option value="slide">Slide</option>
                <option value="link">Link</option>
              </select>
            </div>
            <Uploader name="fileKey" label="File" />
            <button className="btn outline" type="submit">Aggiungi materiale</button>
          </form>
        </div>
      )}

      {!isNew && tab === 'test' && (
        <div className="stack">
          <form action={aiDraftQuiz} className="card row between" style={{ background: 'var(--color-primary-container, #fff1e8)' }}>
            <input type="hidden" name="contentId" value={c!.id} />
            <div>
              <div className="card-title">✨ Assistente AI</div>
              <p className="muted small">Genera una bozza di domande dal titolo e dalla descrizione.</p>
            </div>
            <SubmitButton pendingLabel="Genero…">Genera con AI</SubmitButton>
          </form>
          <form action={saveQuiz} className="card stack">
            <input type="hidden" name="contentId" value={c!.id} />
            <div className="row between">
              <div className="card-title">Test di sblocco (2–3 domande)</div>
              <div className="field" style={{ margin: 0, width: 160 }}>
                <label>Soglia superamento %</label>
                <input className="input" name="passPct" type="number" defaultValue={quiz?.passPct ?? 60} />
              </div>
            </div>
            {[0, 1, 2].map((i) => {
              const q = quiz?.questions[i];
              return (
                <div className="card" key={i} style={{ background: 'var(--color-surface-alt, #faf9f8)' }}>
                  <div className="field">
                    <label>Domanda {i + 1}</label>
                    <input className="input" name={`q${i}_prompt`} defaultValue={q?.prompt ?? ''} />
                  </div>
                  <div className="grid cols-3">
                    {[0, 1, 2].map((o) => (
                      <div className="field" key={o}>
                        <label>
                          <input type="radio" name={`q${i}_correct`} value={o} defaultChecked={(q?.correctIndex ?? 0) === o} />{' '}
                          Opzione {o + 1} {o === (q?.correctIndex ?? 0) ? '(corretta)' : ''}
                        </label>
                        <input className="input" name={`q${i}_opt${o}`} defaultValue={q?.options[o] ?? ''} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <span style={{ alignSelf: 'flex-start' }}>
              <SubmitButton pendingLabel="Salvo…">Salva test</SubmitButton>
            </span>
          </form>
        </div>
      )}

      {!isNew && tab === 'eventi' && (
        <div className="card stack">
          <div className="card-title">Eventi live (Zoom)</div>
          {liveEvents.length > 0 ? (
            <ul>
              {liveEvents.map((e) => (
                <li key={e.id} className="row between" style={{ padding: '6px 0' }}>
                  <span>{new Date(e.startAt).toLocaleString('it-IT')}</span>
                  <span className="muted small">{e.zoomMeetingId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Nessun evento programmato.</p>
          )}
          <form action={createLiveEvent} className="grid cols-3" style={{ alignItems: 'end' }}>
            <input type="hidden" name="contentId" value={c!.id} />
            <div className="field">
              <label>Inizio</label>
              <input className="input" name="startAt" type="datetime-local" required />
            </div>
            <div className="field">
              <label>Durata (min)</label>
              <input className="input" name="durationMin" type="number" defaultValue={90} />
            </div>
            <button className="btn outline" type="submit">Crea evento Zoom</button>
          </form>
        </div>
      )}
    </div>
  );
}
