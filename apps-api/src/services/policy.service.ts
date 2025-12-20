import { HttpError } from "@nuttoo/errors";

export type Actor = {
  subject: string;
  mode: "off" | "shared-secret" | "jwt";
};

export class PolicyService {
  assertCanWrite(actor: Actor) {
    if (actor.mode === "off") return;
    if (actor.mode === "shared-secret") return;
    throw new HttpError(403, "FORBIDDEN", "Actor cannot write");
  }

  assertCanRead(_actor: Actor) {
    return;
  }
}
