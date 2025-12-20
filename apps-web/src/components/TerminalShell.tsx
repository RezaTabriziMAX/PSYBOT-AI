import React from "react";
import Link from "next/link";
import { TerminalFooter } from "./TerminalFooter";
import { WalletConnect } from "./WalletConnect";

export function TerminalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--accent)", letterSpacing: 1 }}>
            NUTTOO TERMINAL
          </Link>
          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
            <Link href="/docs">Docs</Link>
            <Link href="/registry">Registry</Link>
            <Link href="/forks">Forks</Link>
            <Link href="/runs">Runs</Link>
            <Link href="/api-health">API Health</Link>
          </nav>
        </div>
        <WalletConnect />
      </header>

      <main style={{ marginTop: 18 }}>{children}</main>

      <TerminalFooter />
    </div>
  );
}
