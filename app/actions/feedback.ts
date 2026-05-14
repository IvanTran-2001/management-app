"use server";

/**
 * Server actions for the feedback system.
 *
 * submitFeedbackAction   — any signed-in user can submit feedback.
 * toggleFeedbackReviewedAction — admin-only; marks/unmarks a submission as reviewed.
 */

import { FeedbackType } from "@prisma/client";
import { requireUserAction, requireSuperAdminAction } from "@/lib/authz";
import { createFeedback, toggleFeedbackReviewed } from "@/lib/services/feedback";

/**
 * Submits a new piece of feedback on behalf of the signed-in user.
 *
 * @param type     - ISSUE or IDEA
 * @param message  - free-text body (trimmed server-side; empty string rejected)
 * @param orgId    - optional org context, read from the URL by the client component
 * @param imageUrl - optional Supabase Storage path for an attached screenshot
 */
export async function submitFeedbackAction(
  type: FeedbackType,
  message: string,
  orgId?: string | null,
  imageUrl?: string | null,
) {
  const authz = await requireUserAction();
  if (!authz.ok) return { ok: false as const };

  const trimmed = message.trim();
  if (!trimmed) return { ok: false as const };

  await createFeedback(authz.userId, type, trimmed, orgId, imageUrl);
  return { ok: true as const };
}

/**
 * Toggles the reviewed state of a feedback item.
 * Requires the caller to be a super-admin (AdminUser table lookup).
 */
export async function toggleFeedbackReviewedAction(id: string, reviewed: boolean) {
  const authz = await requireSuperAdminAction();
  if (!authz.ok) return { ok: false as const };

  await toggleFeedbackReviewed(id, reviewed);
  return { ok: true as const };
}
