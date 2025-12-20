import { Counter, Gauge, Registry, collectDefaultMetrics } from "prom-client";

export class MetricsService {
  readonly registry: Registry;

  readonly logBatches: Counter<string>;
  readonly slotScans: Counter<string>;
  readonly currentSlot: Gauge<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.logBatches = new Counter({
      name: "nuttoo_indexer_log_batches_total",
      help: "Number of log batches processed",
      registers: [this.registry],
    });

    this.slotScans = new Counter({
      name: "nuttoo_indexer_slot_scans_total",
      help: "Number of slots scanned",
      registers: [this.registry],
    });

    this.currentSlot = new Gauge({
      name: "nuttoo_indexer_current_slot",
      help: "Current observed slot",
      registers: [this.registry],
    });
  }

  onLogBatch() {
    this.logBatches.inc(1);
  }

  onSlotScan() {
    this.slotScans.inc(1);
  }

  setCurrentSlot(slot: number) {
    this.currentSlot.set(slot);
  }
}
