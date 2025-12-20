export type TerminalTheme = {
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  danger: string;
  warn: string;
  ok: string;
  fontFamily: string;
};

export const FALLOUT_THEME: TerminalTheme = {
  bg: "#041b0f",
  fg: "#4dff7a",
  accent: "#7dff9f",
  dim: "#2bbf59",
  danger: "#ff4d4d",
  warn: "#ffd24d",
  ok: "#4dff7a",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};
