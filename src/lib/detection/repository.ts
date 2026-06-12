import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { RecurringCandidate } from "./recurring";

export type CandidateStatus = "New" | "Accepted" | "Merged" | "Dismissed";

export type DetectedCandidate = RecurringCandidate & {
  id: string;
  status: CandidateStatus;
};

type CandidateRecord = {
  id: string;
  userId: string;
  merchantLabel: string;
  normalizedMerchant: string;
  billingCadence: string;
  intervalDays: number | null;
  lastAmount: number;
  averageAmount: number;
  occurrenceCount: number;
  firstChargeDate: string;
  lastChargeDate: string;
  nextEstimatedCharge: string | null;
  confidence: number;
  categoryGuess: string;
  evidenceJson: string;
  status: string;
  matchedSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CandidateData = Omit<CandidateRecord, "createdAt" | "updatedAt">;

export type DetectionStore = {
  detectedCandidate: {
    findMany(args: {
      where: { userId: string };
    }): Promise<CandidateRecord[]>;
    findFirst(args: {
      where: { id: string; userId: string };
    }): Promise<CandidateRecord | null>;
    upsert(args: {
      where: {
        userId_normalizedMerchant: {
          userId: string;
          normalizedMerchant: string;
        };
      };
      update: Omit<CandidateData, "id" | "userId" | "normalizedMerchant" | "status">;
      create: CandidateData;
    }): Promise<CandidateRecord>;
    updateMany(args: {
      where: { id: string; userId: string };
      data: { status: string; updatedAt: Date };
    }): Promise<{ count: number }>;
  };
};

export async function saveScanResults(
  userId: string,
  candidates: RecurringCandidate[],
  store: DetectionStore = prisma,
): Promise<{ newCount: number; skippedActionedCount: number }> {
  const existing = await store.detectedCandidate.findMany({
    where: { userId },
  });
  const statusByMerchant = new Map(
    existing.map((record) => [record.normalizedMerchant, record.status]),
  );

  let newCount = 0;
  let skippedActionedCount = 0;

  for (const candidate of candidates) {
    const existingStatus = statusByMerchant.get(candidate.normalizedMerchant);

    // A candidate the user already accepted, merged, or dismissed must not
    // reappear in the queue on every re-scan.
    if (existingStatus && existingStatus !== "New") {
      skippedActionedCount += 1;
      continue;
    }

    if (!existingStatus) {
      newCount += 1;
    }

    const shared = {
      merchantLabel: candidate.merchantLabel,
      billingCadence: candidate.billingCadence,
      intervalDays: candidate.intervalDays,
      lastAmount: candidate.lastAmount,
      averageAmount: candidate.averageAmount,
      occurrenceCount: candidate.occurrenceCount,
      firstChargeDate: candidate.firstChargeDate,
      lastChargeDate: candidate.lastChargeDate,
      nextEstimatedCharge: candidate.nextEstimatedCharge,
      confidence: candidate.confidence,
      categoryGuess: candidate.categoryGuess,
      evidenceJson: JSON.stringify(candidate.evidence),
      matchedSubscriptionId: candidate.matchedSubscriptionId,
    };

    await store.detectedCandidate.upsert({
      where: {
        userId_normalizedMerchant: {
          userId,
          normalizedMerchant: candidate.normalizedMerchant,
        },
      },
      update: shared,
      create: {
        id: randomUUID(),
        userId,
        normalizedMerchant: candidate.normalizedMerchant,
        status: "New",
        ...shared,
      },
    });
  }

  return { newCount, skippedActionedCount };
}

export async function listDetectedCandidates(
  userId: string,
  store: DetectionStore = prisma,
): Promise<DetectedCandidate[]> {
  const records = await store.detectedCandidate.findMany({ where: { userId } });

  return records.map(mapCandidateRecord).sort(
    (left, right) =>
      statusRank(left.status) - statusRank(right.status) ||
      right.confidence - left.confidence ||
      left.merchantLabel.localeCompare(right.merchantLabel),
  );
}

export async function getDetectedCandidate(
  userId: string,
  id: string,
  store: DetectionStore = prisma,
): Promise<DetectedCandidate | null> {
  const record = await store.detectedCandidate.findFirst({
    where: { id, userId },
  });

  return record ? mapCandidateRecord(record) : null;
}

export async function setCandidateStatus(
  userId: string,
  id: string,
  status: CandidateStatus,
  store: DetectionStore = prisma,
): Promise<boolean> {
  const result = await store.detectedCandidate.updateMany({
    where: { id, userId },
    data: { status, updatedAt: new Date() },
  });

  return result.count > 0;
}

function mapCandidateRecord(record: CandidateRecord): DetectedCandidate {
  return {
    id: record.id,
    status: record.status as CandidateStatus,
    merchantLabel: record.merchantLabel,
    normalizedMerchant: record.normalizedMerchant,
    billingCadence: record.billingCadence as DetectedCandidate["billingCadence"],
    intervalDays: record.intervalDays,
    lastAmount: record.lastAmount,
    averageAmount: record.averageAmount,
    occurrenceCount: record.occurrenceCount,
    firstChargeDate: record.firstChargeDate,
    lastChargeDate: record.lastChargeDate,
    nextEstimatedCharge: record.nextEstimatedCharge,
    confidence: record.confidence,
    categoryGuess: record.categoryGuess as DetectedCandidate["categoryGuess"],
    evidence: parseEvidence(record.evidenceJson),
    matchedSubscriptionId: record.matchedSubscriptionId,
  };
}

function parseEvidence(json: string): DetectedCandidate["evidence"] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function statusRank(status: CandidateStatus): number {
  return status === "New" ? 0 : 1;
}
