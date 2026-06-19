'use client';

import { useFormStatus } from 'react-dom';

/** Submit button that shows a pending state while its parent <form> action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  className = 'btn primary'
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" /> {pendingLabel ?? 'Attendere…'}
        </>
      ) : (
        children
      )}
    </button>
  );
}
