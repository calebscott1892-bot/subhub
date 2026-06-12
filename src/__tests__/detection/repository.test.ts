import { describe, expect, test } from "vitest";
import {
  getDetectedCandidate,
  listDetectedCandidates,
  saveScanResults,
  setCandidateStatus,
  type DetectionStore,
} from "@/lib/detection/repository";
import type { RecurringCandidate } from "@/lib/detection/recurring";

describe("detection repository", () => {
  test("saves new candidates and lists them queue-first", async () => {
    const store = createFakeStore();

    const result = await saveScanResults(
      "user-1",
      [makeCandidate("disney plus", 0.9), makeCandidate("audible au", 0.7)],
      store,
    );

    expect(result.newCount).toBe(2);
    const listed = await listDetectedCandidates("user-1", store);
    expect(listed.map((candidate) => candidate.normalizedMerchant)).toEqual([
      "disney plus",
      "audible au",
    ]);
    expect(listed[0].status).toBe("New");
  });

  test("re-scans refresh open candidates but never resurrect actioned ones", async () => {
    const store = createFakeStore();
    await saveScanResults("user-1", [makeCandidate("disney plus", 0.8)], store);
    const [candidate] = await listDetectedCandidates("user-1", store);
    await setCandidateStatus("user-1", candidate.id, "Dismissed", store);

    const rescan = await saveScanResults(
      "user-1",
      [makeCandidate("disney plus", 0.95)],
      store,
    );

    expect(rescan.skippedActionedCount).toBe(1);
    const after = await listDetectedCandidates("user-1", store);
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe("Dismissed");
    expect(after[0].confidence).toBe(0.8);
  });

  test("status changes are owner-scoped", async () => {
    const store = createFakeStore();
    await saveScanResults("user-1", [makeCandidate("disney plus", 0.8)], store);
    const [candidate] = await listDetectedCandidates("user-1", store);

    await expect(
      setCandidateStatus("user-2", candidate.id, "Accepted", store),
    ).resolves.toBe(false);
    await expect(
      getDetectedCandidate("user-2", candidate.id, store),
    ).resolves.toBeNull();
    await expect(
      setCandidateStatus("user-1", candidate.id, "Accepted", store),
    ).resolves.toBe(true);
  });
});

type FakeRecord = {
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

function makeCandidate(
  normalizedMerchant: string,
  confidence: number,
): RecurringCandidate {
  return {
    merchantLabel: normalizedMerchant.toUpperCase(),
    normalizedMerchant,
    billingCadence: "Monthly",
    intervalDays: null,
    lastAmount: 13.99,
    averageAmount: 13.99,
    occurrenceCount: 3,
    firstChargeDate: "2026-03-09",
    lastChargeDate: "2026-05-09",
    nextEstimatedCharge: "2026-06-09",
    confidence,
    categoryGuess: "Streaming",
    evidence: [
      { date: "2026-05-09", description: "CHARGE", amount: 13.99 },
    ],
    matchedSubscriptionId: null,
  };
}

function createFakeStore(): DetectionStore {
  const now = new Date("2026-06-12T00:00:00.000Z");
  const records: FakeRecord[] = [];

  return {
    detectedCandidate: {
      findMany: async ({ where }) =>
        records.filter((record) => record.userId === where.userId),
      findFirst: async ({ where }) =>
        records.find(
          (record) => record.id === where.id && record.userId === where.userId,
        ) ?? null,
      upsert: async ({ where, update, create }) => {
        const existing = records.find(
          (record) =>
            record.userId === where.userId_normalizedMerchant.userId &&
            record.normalizedMerchant ===
              where.userId_normalizedMerchant.normalizedMerchant,
        );

        if (existing) {
          Object.assign(existing, update, { updatedAt: now });
          return existing;
        }

        const created = { ...create, createdAt: now, updatedAt: now };
        records.push(created);
        return created;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;

        for (const record of records) {
          if (record.id === where.id && record.userId === where.userId) {
            record.status = data.status;
            record.updatedAt = data.updatedAt;
            count += 1;
          }
        }

        return { count };
      },
    },
  };
}
