export type SafetyPolicy = {
  allowNetwork: boolean;
  allowPublishing: boolean;
  allowRunning: boolean;
};

export function defaultSafetyPolicy(): SafetyPolicy {
  return {
    allowNetwork: true,
    allowPublishing: false,
    allowRunning: false,
  };
}
