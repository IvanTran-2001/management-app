import { requireOrgPermissionPage } from "@/lib/authz";
import { getTimetableTemplates } from "@/lib/services/templates";
import { PermissionAction } from "@prisma/client";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireOrgPermissionPage(orgId, PermissionAction.MANAGE_TIMETABLE, {
    redirectTo: `/orgs/${orgId}/timetable`,
  });

  const templates = await getTimetableTemplates(orgId);

  return <TemplatesClient orgId={orgId} templates={templates} />;
}
