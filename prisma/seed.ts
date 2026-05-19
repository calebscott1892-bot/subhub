import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { buildNotificationSchedules } from "../src/lib/notifications/schedule";
import { sampleSubscriptions } from "../src/lib/subscriptions/sample-data";

const prisma = new PrismaClient();
const demoUserId = "demo-user";
const seedDate = "2026-05-19";
const seedTimezone = "Australia/Perth";

async function main() {
  await prisma.notification.deleteMany({
    where: { userId: demoUserId },
  });

  for (const subscription of sampleSubscriptions) {
    await prisma.subscription.upsert({
      where: { id: subscription.id },
      update: {
        userId: demoUserId,
        providerName: subscription.providerName,
        category: subscription.category,
        status: subscription.status,
        billingCadence: subscription.billingCadence,
        intervalDays: subscription.intervalDays,
        priceAmount: subscription.priceAmount,
        currency: subscription.currency,
        startDate: subscription.startDate,
        renewalDate: subscription.renewalDate,
        trialStartDate: subscription.trialStartDate,
        trialEndDate: subscription.trialEndDate,
        cancelByDate: subscription.cancelByDate,
        postTrialPriceAmount: subscription.postTrialPriceAmount,
        accountEmailForProvider: subscription.accountEmailForProvider,
        loginUrl: subscription.loginUrl,
        billingUrl: subscription.billingUrl,
        cancelUrl: subscription.cancelUrl,
        supportUrl: subscription.supportUrl,
        paymentMethodLabel: subscription.paymentMethodLabel,
        notes: subscription.notes,
        lastUsageDate: subscription.lastUsageDate,
      },
      create: {
        id: subscription.id,
        userId: demoUserId,
        providerName: subscription.providerName,
        category: subscription.category,
        status: subscription.status,
        billingCadence: subscription.billingCadence,
        intervalDays: subscription.intervalDays,
        priceAmount: subscription.priceAmount,
        currency: subscription.currency,
        startDate: subscription.startDate,
        renewalDate: subscription.renewalDate,
        trialStartDate: subscription.trialStartDate,
        trialEndDate: subscription.trialEndDate,
        cancelByDate: subscription.cancelByDate,
        postTrialPriceAmount: subscription.postTrialPriceAmount,
        accountEmailForProvider: subscription.accountEmailForProvider,
        loginUrl: subscription.loginUrl,
        billingUrl: subscription.billingUrl,
        cancelUrl: subscription.cancelUrl,
        supportUrl: subscription.supportUrl,
        paymentMethodLabel: subscription.paymentMethodLabel,
        notes: subscription.notes,
        lastUsageDate: subscription.lastUsageDate,
      },
    });

    const schedules = buildNotificationSchedules({
      subscription,
      userId: demoUserId,
      fromDate: seedDate,
      timezone: seedTimezone,
    });

    for (const schedule of schedules) {
      await prisma.notification.upsert({
        where: { dedupeKey: schedule.dedupeKey },
        update: {
          type: schedule.type,
          channel: schedule.channel,
          status: "Scheduled",
          scheduledFor: new Date(schedule.scheduledFor),
          payloadTitle: schedule.payload.title,
          payloadBody: schedule.payload.body,
          payloadUrl: schedule.payload.url,
        },
        create: {
          id: randomUUID(),
          userId: schedule.userId,
          subscriptionId: schedule.subscriptionId,
          type: schedule.type,
          channel: schedule.channel,
          status: "Scheduled",
          scheduledFor: new Date(schedule.scheduledFor),
          sentAt: null,
          readAt: null,
          dedupeKey: schedule.dedupeKey,
          payloadTitle: schedule.payload.title,
          payloadBody: schedule.payload.body,
          payloadUrl: schedule.payload.url,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
