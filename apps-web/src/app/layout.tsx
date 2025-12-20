import type { Metadata } from "next";
import "@/styles/globals.css";
import { TerminalShell } from "@/components/TerminalShell";

export const metadata: Metadata = {
  title: "Nuttoo Terminal",
  description: "A Fallout-style terminal interface for Nuttoo",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TerminalShell>{children}</TerminalShell>
      </body>
    </html>
  );
}
