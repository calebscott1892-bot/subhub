import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { buildNotificationSchedules } from "../src/lib/notifications/schedule";
import { sampleSubscriptions } from "../src/lib/subscriptions/sample-data";

const prisma = new PrismaClient();
const demoUserId = "demo-user";
const seedDate = "2026-05-19";
const seedTimezone = "Australia/Perth";

const demoHousehold = {
  id: "demo-household",
  name: "Demo household",
  members: [
    {
      id: "member-jordan",
      name: "Jordan",
      email: null as string | null,
      role: "Adult",
      status: "Active",
    },
    {
      id: "member-sam",
      name: "Sam",
      email: "sam@example.com" as string | null,
      role: "Member",
      status: "Invited",
    },
  ],
  shares: [
    {
      id: "share-netflix-jordan",
      subscriptionId: "netflix-premium",
      memberId: "member-jordan",
      fixedAmount: null as number | null,
      percentage: null as number | null,
    },
    {
      id: "share-netflix-sam",
      subscriptionId: "netflix-premium",
      memberId: "member-sam",
      fixedAmount: null as number | null,
      percentage: null as number | null,
    },
    {
      id: "share-spotify-jordan",
      subscriptionId: "spotify-family",
      memberId: "member-jordan",
      fixedAmount: null as number | null,
      percentage: 40 as number | null,
    },
  ],
};

const demoBudget = {
  monthlyTarget: 175,
  currency: "USD",
  categories: [
    { category: "Streaming", monthlyTarget: 30 },
    { category: "Music", monthlyTarget: 25 },
    { category: "Software", monthlyTarget: 60 },
    { category: "Storage", monthlyTarget: 5 },
    { category: "Health", monthlyTarget: 40 },
  ],
};

async function main() {
  await prisma.notification.deleteMany({
    where: { userId: demoUserId },
  });

  await prisma.budgetSettings.upsert({
    where: { userId: demoUserId },
    update: {
      monthlyTarget: demoBudget.monthlyTarget,
      currency: demoBudget.currency,
    },
    create: {
      id: randomUUID(),
      userId: demoUserId,
      monthlyTarget: demoBudget.monthlyTarget,
      currency: demoBudget.currency,
    },
  });

  for (const target of demoBudget.categories) {
    await prisma.categoryBudget.upsert({
      where: {
        userId_category: { userId: demoUserId, category: target.category },
      },
      update: { monthlyTarget: target.monthlyTarget },
      create: {
        id: randomUUID(),
        userId: demoUserId,
        category: target.category,
        monthlyTarget: target.monthlyTarget,
      },
    });
  }

  await prisma.household.upsert({
    where: { ownerUserId: demoUserId },
    update: { name: demoHousehold.name },
    create: {
      id: demoHousehold.id,
      ownerUserId: demoUserId,
      name: demoHousehold.name,
    },
  });

  for (const member of demoHousehold.members) {
    await prisma.householdMember.upsert({
      where: { id: member.id },
      update: {
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
      create: {
        id: member.id,
        householdId: demoHousehold.id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      },
    });
  }

  for (const share of demoHousehold.shares) {
    await prisma.subscriptionShare.upsert({
      where: {
        subscriptionId_memberId: {
          subscriptionId: share.subscriptionId,
          memberId: share.memberId,
        },
      },
      update: {
        fixedAmount: share.fixedAmount,
        percentage: share.percentage,
      },
      create: {
        id: share.id,
        subscriptionId: share.subscriptionId,
        memberId: share.memberId,
        fixedAmount: share.fixedAmount,
        percentage: share.percentage,
      },
    });
  }

  for (const subscription of sampleSubscriptions) {
    await prisma.subscription.upsert({
      where: { id: subscription.id },
      update: {
        userId: demoUserId,
        isShared: subscription.isShared ?? false,
        splitType: subscription.splitType ?? null,
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
        isShared: subscription.isShared ?? false,
        splitType: subscription.splitType ?? null,
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
