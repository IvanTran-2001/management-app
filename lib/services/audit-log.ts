/**
 * Audit log service.
 *
 * logAudit  — write a single log entry. Pass the transaction client `db` when
 *             inside a Prisma transaction so the log commits atomically with
 *             the mutation; pass `prisma` for standalone (non-transactional)
 *             calls and fire-and-forget with .catch() so a log failure never
 *             blocks the main operation.
 *
 * getAuditLogs — read log entries for an org, newest-first.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Re-derives the transaction client type so this module has no runtime
// dependency on franchise.ts while staying in sync with Prisma's types.
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface AuditLogInput {
  orgId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonObject | null;
  after?: Prisma.InputJsonObject | null;
}

/**
 * Writes an audit log entry.
 *
 * When called inside a transaction, pass the transaction client so the log is
 * committed atomically with the mutation it describes. When called outside a
 * transaction, pass `prisma` and chain `.catch()` so a log write failure never
 * surfaces as a user-facing error.
 */
export function logAudit(db: Tx, entry: AuditLogInput) {
  return db.auditLog.create({
    data: {
      orgId: entry.orgId,
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before ?? Prisma.JsonNull,
      after: entry.after ?? Prisma.JsonNull,
    },
  });
}

/**
 * Returns the audit log for an org, newest-first, with actor details inlined.
 * `limit` defaults to 100 — callers can paginate by adjusting this and
 * supplying a cursor once a UI is built.
 */
export async function getAuditLogs(orgId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { orgId },
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
