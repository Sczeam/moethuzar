export default function AdminCatalogLoadingPage() {
  return (
    <main className="w-full space-y-6">
      <div className="h-11 w-44 animate-pulse rounded bg-sepia-border/45" />
      <div className="mt-6 vintage-panel p-5">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-8 animate-pulse rounded bg-sepia-border/35" />
          ))}
        </div>
      </div>
    </main>
  );
}
