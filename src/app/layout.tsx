// Root layout is intentionally minimal — the real <html>/<body> lives in
// app/[locale]/layout.tsx so we can set `lang` and `dir` per locale on the
// server with no flash. Next still requires this file to exist.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
