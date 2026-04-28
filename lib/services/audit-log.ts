/**
 * Audit log service.
 *
 * recordAudit — write a single log entry. Always fire-and-forget: errors are
 *               captured via Sentry and never propagated to the caller.
 *               Call sites do NOT need .catch() or try/catch.
 *
 * getAuditLogs — read log entries for an org, newest-first.
 *
 * ─── Checklist for new service mutations ────────────────────────────────────
 * When adding a new service function that mutates data, ask:
 *
 *  1. Is it a significant business action? (not a status bump, join-table
 *     write, or cascade side-effect — think "would an org owner care?")
 *     → If yes, call recordAudit. If no, skip it.
 *
 *  2. Does the function need a before snapshot?
 *     → For updates/deletes: fetch the record before mutating and pass it
 *       as `before`. For creates, omit `before` (leave null).
 *
 *  3. Add `actorId?: string | null` to the service function signature and
 *     pass `authz.userId` from the calling action/API route.
 *
 *  4. Name the action as "<entity>.<verb>" in lowercase, e.g.:
 *     "org.update", "role.delete", "invite.send", "bot.create"
 * ────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from "@/lib/prisma";
import { log } from "@/lib/observability";
import { Prisma } from "@prisma/client";

export interface AuditLogInput {
  orgId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown> | null;
}

/**
 * Writes an audit log entry. Never throws — if the write fails, the error is
 * captured via Sentry so the caller's mutation always succeeds.
 */
export async function recordAudit(params: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        before: (params.before as Prisma.InputJsonObject | null | undefined) ?? Prisma.JsonNull,
        after: (params.after as Prisma.InputJsonObject | null | undefined) ?? Prisma.JsonNull,
        metadata: (params.metadata as Prisma.InputJsonObject | null | undefined) ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    // NEVER throw — audit failure should not break the user's mutation
    log.error("Audit log write failed", { error, params });
  }
}

/**
 * Returns the audit log for an org, newest-first.
 * `limit` defaults to 100 — callers can paginate by adjusting this.
 */
export async function getAuditLogs(orgId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
