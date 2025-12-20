import prompts from "prompts";

export async function promptText(opts: { message: string; initial?: string; validate?: (v: string) => true | string }) {
  const res = await prompts({
    type: "text",
    name: "value",
    message: opts.message,
    initial: opts.initial,
    validate: (v: string) => opts.validate ? opts.validate(v) : true,
  });
  return String(res.value ?? "");
}

export async function promptConfirm(opts: { message: string; initial?: boolean }) {
  const res = await prompts({
    type: "confirm",
    name: "value",
    message: opts.message,
    initial: opts.initial ?? true,
  });
  return Boolean(res.value);
}

export async function promptSelect<T extends string>(opts: { message: string; choices: Array<{ title: string; value: T }> }) {
  const res = await prompts({
    type: "select",
    name: "value",
    message: opts.message,
    choices: opts.choices.map((c) => ({ title: c.title, value: c.value })),
  });
  return res.value as T;
}
