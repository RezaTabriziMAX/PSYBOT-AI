import { context, trace, SpanStatusCode } from "@opentelemetry/api";

export type TraceContext = {
  traceId?: string;
  spanId?: string;
};

export function currentTrace(): TraceContext {
  const span = trace.getSpan(context.active());
  if (!span) return {};
  const sc = span.spanContext();
  return { traceId: sc.traceId, spanId: sc.spanId };
}

export function recordError(err: unknown): void {
  const span = trace.getSpan(context.active());
  if (!span) return;
  const message = err instanceof Error ? err.message : String(err);
  span.recordException(err as any);
  span.setStatus({ code: SpanStatusCode.ERROR, message });
}
