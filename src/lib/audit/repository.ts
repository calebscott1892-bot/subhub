import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export type AuditAction =
  | "Created"
  | "Updated"
  | "Deleted"
  | "StatusChange"
  | "PriceChange"
  | "CancellationRequested"
  | "MarkedCanceled"
  | "TrialVerdict"
  | "SharingChanged"
  | "Imported"
  | "DetectionAccepted"
  | "BudgetUpdated";

export type AuditEvent = {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  summary: string;
  createdAt: string;
};

type AuditEventRecord = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  createdAt: Date;
};

export type AuditStore = {
  auditEvent: {
    create(args: {
      data: Omit<AuditEventRecord, "createdAt">;
    }): Promise<AuditEventRecord>;
    findMany(args: {
      where: { userId: string; entityId?: string };
      orderBy?: Array<Record<string, string>>;
      take?: number;
    }): Promise<AuditEventRecord[]>;
  };
};

export async function recordAuditEvent(
  userId: string,
  event: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    summary: string;
  },
  store: AuditStore = prisma,
): Promise<void> {
  await store.auditEvent.create({
    data: {
      id: randomUUID(),
      userId,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      summary: event.summary,
    },
  });
}

export async function listRecentAuditEvents(
  userId: string,
  limit = 8,
  store: AuditStore = prisma,
): Promise<AuditEvent[]> {
  const records = await store.auditEvent.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  return records.map(mapAuditRecord);
}

export async function listAuditEventsForEntity(
  userId: string,
  entityId: string,
  store: AuditStore = prisma,
): Promise<AuditEvent[]> {
  const records = await store.auditEvent.findMany({
    where: { userId, entityId },
    orderBy: [{ createdAt: "desc" }],
  });

  return records.map(mapAuditRecord);
}

function mapAuditRecord(record: AuditEventRecord): AuditEvent {
  return {
    id: record.id,
    entityType: record.entityType,
    entityId: record.entityId,
    action: record.action as AuditAction,
    summary: record.summary,
    createdAt: record.createdAt.toISOString(),
  };
}
