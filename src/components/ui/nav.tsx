import Link from "next/link";

export function Nav() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--card)",
      }}
      className="flex items-center gap-8 px-6 py-3"
    >
      <Link
        href="/pipeline"
        className="flex items-center gap-2 font-mono text-sm font-bold tracking-[0.2em] uppercase"
        style={{ color: "var(--accent-green)" }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse-dot"
          style={{ background: "var(--accent-green)" }}
        />
        NORAD
      </Link>
      <nav className="flex items-center gap-6 ml-4">
        <NavLink href="/pipeline">Pipeline</NavLink>
        <NavLink href="/radar">Radar</NavLink>
        <NavLink href="/settings/integrations">Settings</NavLink>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs tracking-widest uppercase transition-colors"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </Link>
  );
}
