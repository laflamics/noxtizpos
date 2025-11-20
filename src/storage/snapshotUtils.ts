import type {
  ActivityLog,
  Category,
  Order,
  Product,
  SnapshotImportOptions,
  StockMovement,
  StorageSnapshot,
  SyncEntityStats,
  SyncReport,
  Table,
  User,
} from '@/types';

export type Entity =
  | User
  | Product
  | Category
  | Order
  | StockMovement
  | Table
  | ActivityLog;

export type SnapshotCollectionKey = Exclude<keyof StorageSnapshot, 'generatedAt'>;

export const defaultImportOptions: SnapshotImportOptions = {
  mode: 'insert_only',
};

export function createEmptySyncReport(): SyncReport {
  const emptyStats: SyncEntityStats = { inserted: 0, updated: 0, skipped: 0 };
  return {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    totalInserted: 0,
    entities: {
      users: { ...emptyStats },
      products: { ...emptyStats },
      categories: { ...emptyStats },
      orders: { ...emptyStats },
      stockMovements: { ...emptyStats },
      tables: { ...emptyStats },
      activityLogs: { ...emptyStats },
    },
  };
}

export function finalizeReport(report: SyncReport): SyncReport {
  report.finishedAt = new Date().toISOString();
  report.totalInserted = Object.values(report.entities).reduce(
    (sum, stats) => sum + stats.inserted,
    0
  );
  return report;
}

export function mergeCollection<T extends Entity>(
  existing: T[],
  incoming: T[],
  options: SnapshotImportOptions = defaultImportOptions
): { data: T[]; stats: SyncEntityStats } {
  const mode = options.mode ?? 'insert_only';
  const map = new Map(existing.map(item => [item.id, item]));
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of incoming) {
    if (!item?.id) {
      skipped++;
      continue;
    }

    if (!map.has(item.id)) {
      map.set(item.id, item);
      inserted++;
      continue;
    }

    if (mode === 'upsert') {
      const current = map.get(item.id)!;
      map.set(item.id, { ...current, ...item });
      updated++;
    } else {
      skipped++;
    }
  }

  return {
    data: Array.from(map.values()),
    stats: { inserted, updated, skipped },
  };
}

export function normalizeSnapshot(snapshot?: StorageSnapshot): StorageSnapshot {
  return {
    generatedAt: snapshot?.generatedAt ?? new Date().toISOString(),
    users: snapshot?.users ?? [],
    products: snapshot?.products ?? [],
    categories: snapshot?.categories ?? [],
    orders: snapshot?.orders ?? [],
    stockMovements: snapshot?.stockMovements ?? [],
    tables: snapshot?.tables ?? [],
    activityLogs: snapshot?.activityLogs ?? [],
  };
}

