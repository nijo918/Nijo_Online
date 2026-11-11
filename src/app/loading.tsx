export default function Loading() {
  return (
    <div className="shell section" role="status" aria-label="Loading page">
      <div className="skeleton skeleton-title" />
      <div className="course-grid">
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton skeleton-card" />
        ))}
      </div>
      <p>Getting things ready…</p>
    </div>
  );
}
