"use client";

import React, { useEffect, useState } from "react";
import { connectWallet, disconnectWallet, getPhantom, WalletState } from "@/lib/solana";

export function WalletConnect() {
  const [state, setState] = useState<WalletState>({ connected: false });
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const p = getPhantom();
    setAvailable(!!p);
    if (p?.publicKey) {
      setState({ connected: true, publicKey: p.publicKey.toString() });
    }
  }, []);

  const connect = async () => {
    const res = await connectWallet();
    setState(res);
  };

  const disconnect = async () => {
    await disconnectWallet();
    setState({ connected: false });
  };

  if (!available) {
    return <div style={{ color: "var(--dim)", fontSize: 12 }}>Wallet: Phantom not detected</div>;
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {state.connected ? (
        <>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>Wallet</span>
          <code style={{ color: "var(--accent)" }}>{shortPk(state.publicKey ?? "")}</code>
          <button onClick={disconnect} style={btnStyle()}>
            Disconnect
          </button>
        </>
      ) : (
        <button onClick={connect} style={btnStyle()}>
          Connect
        </button>
      )}
    </div>
  );
}

function shortPk(pk: string) {
  if (!pk) return "";
  if (pk.length <= 12) return pk;
  return pk.slice(0, 4) + "…" + pk.slice(-4);
}

function btnStyle(): React.CSSProperties {
  return {
    cursor: "pointer",
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--fg)",
    fontFamily: "inherit",
  };
}
