"use client";

import React, { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={onCopy}
      style={{
        cursor: "pointer",
        borderRadius: 10,
        padding: "10px 12px",
        border: "1px solid var(--border)",
        background: "rgba(77,255,122,0.08)",
        color: "var(--accent)",
        fontFamily: "inherit",
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
