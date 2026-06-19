export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Caricamento">
      <div className="skeleton" style={{ height: 28, width: 240 }} />
      <div className="skeleton" style={{ height: 16, width: 360 }} />
      <div className="grid cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  );
}
