export default function AdminOrdersLoadingPage() {
  return (
    <main className="vintage-shell">
      <div className="h-11 w-40 animate-pulse rounded bg-sepia-border/45" />
      <div className="mt-6 vintage-panel p-4">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-8 animate-pulse rounded bg-sepia-border/35" />
          ))}
        </div>
      </div>
    </main>
  );
}
