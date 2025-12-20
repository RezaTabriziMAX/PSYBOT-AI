export type Limits = {
  maxModulesPerTick: number;
  maxForkSuggestionsPerTick: number;
  maxActionsPerTick: number;
  maxPayloadBytes: number;
};

export function defaultLimits(): Limits {
  return {
    maxModulesPerTick: 2,
    maxForkSuggestionsPerTick: 3,
    maxActionsPerTick: 3,
    maxPayloadBytes: 2_000_000,
  };
}
