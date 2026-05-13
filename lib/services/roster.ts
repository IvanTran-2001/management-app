/**
 * @file roster.ts
 * Service functions for reading and mutating roster entries and day configs.
 */
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RosterMember = {
  membershipId: string;
  name: string;
  shiftStartMin: number | null;
  shiftEndMin: number | null;
};

export type RosterCell = {
  dayIndex: number;
  weekStart: Date;
  members: RosterMember[];
};

export type RosterDayConfigRow = {
  dayIndex: number;
  recommendedSize: number;
  openTimeMin: number | null;
  closeTimeMin: number | null;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the org's default open/close times.
 */
export async function getOrgSchedule(
  orgId: string,
): Promise<{ openTimeMin: number | null; closeTimeMin: number | null; timezone: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { openTimeMin: true, closeTimeMin: true, timezone: true },
  });
  return {
    openTimeMin: org?.openTimeMin ?? null,
    closeTimeMin: org?.closeTimeMin ?? null,
    timezone: org?.timezone ?? "UTC",
  };
}

/**
 * Returns true if the org has any roster entries or day configs (i.e. has used the Roster tool).
 */
export async function hasRosterActivity(orgId: string): Promise<boolean> {
  const [entries, configs] = await Promise.all([
    prisma.rosterEntry.count({ where: { orgId } }),
    prisma.rosterDayConfig.count({ where: { orgId } }),
  ]);
  return entries > 0 || configs > 0;
}

/**
 * Returns all RosterEntry rows for the given org and list of weekStart dates,
 * grouped by dayIndex within each weekStart.
 */
export async function getRosterEntries(orgId: string, weekStarts: Date[]) {
  if (weekStarts.length === 0) return [];
  return prisma.rosterEntry.findMany({
    where: { orgId, weekStart: { in: weekStarts } },
    include: {
      membership: {
        select: {
          id: true,
          botName: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: [{ weekStart: "asc" }, { dayIndex: "asc" }],
  });
}

/**
 * Returns all RosterDayConfig rows for the org, keyed by dayIndex.
 */
export async function getRosterDayConfigs(orgId: string) {
  return prisma.rosterDayConfig.findMany({
    where: { orgId },
    orderBy: { dayIndex: "asc" },
  });
}

/**
 * Returns all active memberships for the org (for the member picker).
 */
export async function getOrgMembersForRoster(orgId: string) {
  return prisma.membership.findMany({
    where: { orgId, status: "ACTIVE" },
    select: {
      id: true,
      botName: true,
      user: { select: { name: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type RosterCellMember = {
  membershipId: string;
  shiftStartMin: number | null;
  shiftEndMin: number | null;
};

/**
 * Replaces all members assigned to a specific (weekStart, dayIndex) cell.
 * Runs in a transaction: deletes existing, then inserts new.
 */
export async function setRosterCellMembers(
  orgId: string,
  weekStart: Date,
  dayIndex: number,
  members: RosterCellMember[],
): Promise<ServiceResult<null>> {
  if (dayIndex < 0 || dayIndex > 6)
    return { ok: false, error: "Invalid day index", code: "INVALID" };

  const membershipIds = members.map((m) => m.membershipId);

  // Verify all memberships belong to this org
  if (membershipIds.length > 0) {
    const count = await prisma.membership.count({
      where: { id: { in: membershipIds }, orgId },
    });
    if (count !== membershipIds.length)
      return { ok: false, error: "Invalid membership", code: "NOT_FOUND" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.rosterEntry.deleteMany({
      where: { orgId, weekStart, dayIndex },
    });
    if (members.length > 0) {
      await tx.rosterEntry.createMany({
        data: members.map((m) => ({
          orgId,
          membershipId: m.membershipId,
          weekStart,
          dayIndex,
          shiftStartMin: m.shiftStartMin,
          shiftEndMin: m.shiftEndMin,
        })),
      });
    }
  });

  return { ok: true, data: null };
}

/**
 * Upserts the RosterDayConfig for a given dayIndex.
 */
export async function upsertRosterDayConfig(
  orgId: string,
  dayIndex: number,
  data: {
    recommendedSize?: number;
    openTimeMin?: number | null;
    closeTimeMin?: number | null;
  },
): Promise<ServiceResult<null>> {
  if (dayIndex < 0 || dayIndex > 6)
    return { ok: false, error: "Invalid day index", code: "INVALID" };
  if (
    data.recommendedSize !== undefined &&
    (data.recommendedSize < 0 || data.recommendedSize > 100)
  )
    return { ok: false, error: "Invalid recommended size", code: "INVALID" };

  await prisma.rosterDayConfig.upsert({
    where: { orgId_dayIndex: { orgId, dayIndex } },
    create: { orgId, dayIndex, ...data },
    update: data,
  });

  return { ok: true, data: null };
}
