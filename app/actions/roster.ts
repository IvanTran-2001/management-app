"use server";

import { PermissionAction } from "@prisma/client";
import { requireOrgPermissionAction } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import {
  setRosterCellMembers,
  upsertRosterDayConfig,
} from "@/lib/services/roster";

function rosterPath(orgId: string) {
  return `/orgs/${orgId}/tools/roster`;
}

export async function setRosterCellMembersAction(
  orgId: string,
  weekStart: Date,
  dayIndex: number,
  membershipIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const authz = await requireOrgPermissionAction(
    orgId,
    PermissionAction.MANAGE_TIMETABLE,
  );
  if (!authz.ok) return { ok: false, error: "Unauthorized" };

  const result = await setRosterCellMembers(
    orgId,
    weekStart,
    dayIndex,
    membershipIds,
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(rosterPath(orgId));
  return { ok: true };
}

export async function upsertRosterDayConfigAction(
  orgId: string,
  dayIndex: number,
  data: {
    recommendedSize?: number;
    openTimeMin?: number | null;
    closeTimeMin?: number | null;
  },
): Promise<{ ok: boolean; error?: string }> {
  const authz = await requireOrgPermissionAction(
    orgId,
    PermissionAction.MANAGE_TIMETABLE,
  );
  if (!authz.ok) return { ok: false, error: "Unauthorized" };

  const result = await upsertRosterDayConfig(orgId, dayIndex, data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(rosterPath(orgId));
  return { ok: true };
}
