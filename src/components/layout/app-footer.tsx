export function AppFooter() {
  return (
    <footer className="border-t bg-background px-4 py-3 text-xs text-muted-foreground">
      <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} MAQIL.ERP — Internal Use Only</span>
        <span>v0.1.0</span>
      </div>
    </footer>
  );
}
