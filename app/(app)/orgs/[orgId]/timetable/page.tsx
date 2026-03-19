import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOrgMember } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getTaskInstancesForTimetable } from "@/lib/services/task-instances";
import { getTimetableTemplates, getTimetableTemplate } from "@/lib/services/templates";
import { Toolbar } from "@/components/layout/toolbar";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  TimetableClient,
  type ClientTimetableInstance,
} from "./timetable-client";
import { TemplateSelector } from "./template-selector";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Returns the YYYY-MM-DD string for the Monday of the week containing `date` (UTC). */
function getMondayDateStr(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split("T")[0];
}

/**
 * Projects template instances onto a calendar week.
 *
 * If the template has an `effectiveFrom` date, the cycle is aligned to it so
 * Day 1 always lands on the correct weekday. Otherwise Day 1 = Monday.
 *
 * For cycles shorter than 7 days (e.g. a 3-day cycle) the projection repeats
 * within the week so every day is covered.
 */
function projectTemplateToWeek(
  template: NonNullable<Awaited<ReturnType<typeof getTimetableTemplate>>>,
  weekStart: string,
): ClientTimetableInstance[] {
  const weekStartDate = new Date(weekStart + "T00:00:00Z");
  const { templateDays, effectiveFrom, instances } = template;

  // Anchor the cycle: use effectiveFrom if set, otherwise fall back to a
  // fixed Monday (2000-01-03) so cycles with any templateDays length stay
  // continuous and correct across all weeks without an explicit start date.
  const anchor = effectiveFrom ?? new Date("2000-01-03T00:00:00Z");
  const daysSince = Math.floor(
    (weekStartDate.getTime() - anchor.getTime()) / MS_PER_DAY,
  );
  const cycleStartOffset = ((daysSince % templateDays) + templateDays) % templateDays;

  const result: ClientTimetableInstance[] = [];

  for (const inst of instances) {
    if (inst.dayOffset == null || inst.startTimeMin == null) continue;

    // base weekday index for this dayOffset (0 = Monday of this week)
    const baseIndex =
      ((inst.dayOffset - 1 - cycleStartOffset) % templateDays + templateDays) %
      templateDays;

    // repeat if templateDays < 7 (short cycles fill whole week)
    let weekdayIndex = baseIndex;
    while (weekdayIndex < 7) {
      const dayDate = new Date(weekStartDate.getTime() + weekdayIndex * MS_PER_DAY);
      const startMs = dayDate.getTime() + inst.startTimeMin * 60 * 1000;
      const endMs = startMs + inst.task.durationMin * 60 * 1000;

      result.push({
        id: `${inst.id}-d${weekdayIndex}`,
        taskId: inst.task.id,
        status: "TODO",
        scheduledStartAt: new Date(startMs).toISOString(),
        scheduledEndAt: new Date(endMs).toISOString(),
        task: {
          id: inst.task.id,
          title: inst.task.title,
          durationMin: inst.task.durationMin,
          preferredStartTimeMin: null,
        },
        assignees: inst.assignees.map((a) => ({
          id: a.id,
          membership: {
            id: a.membership.id,
            user: { id: a.membership.user.id, name: a.membership.user.name },
          },
        })),
      });

      weekdayIndex += templateDays;
    }
  }

  return result;
}

export default async function TimetablePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ week?: string; mode?: string; template?: string }>;
}) {
  const { orgId } = await params;
  const { week: weekParam, mode: modeParam, template: templateParam } = await searchParams;

  const authz = await requireOrgMember(orgId);
  if (!authz.ok) redirect("/");

  let weekStart: string;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    const parsed = new Date(weekParam + "T00:00:00Z");
    weekStart = Number.isNaN(parsed.getTime())
      ? getMondayDateStr(new Date())
      : getMondayDateStr(parsed);
  } else {
    weekStart = getMondayDateStr(new Date());
  }

  const from = new Date(weekStart + "T00:00:00Z");
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 7);

  const mode = modeParam === "simple" ? "simple" : "calendar";
  const selectedTemplateId = templateParam ?? null;

  const [org, templates, selectedTemplate, rawInstances] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { openTimeMin: true, closeTimeMin: true },
    }),
    getTimetableTemplates(orgId),
    selectedTemplateId
      ? getTimetableTemplate(orgId, selectedTemplateId)
      : Promise.resolve(null),
    // Only fetch live scheduled instances when no template is selected
    selectedTemplateId
      ? Promise.resolve([])
      : getTaskInstancesForTimetable(orgId, from, to),
  ]);

  let instances: ClientTimetableInstance[];

  if (selectedTemplate) {
    // Project cycle template onto this week
    instances = projectTemplateToWeek(selectedTemplate, weekStart);
  } else if (selectedTemplateId) {
    // Template param set but not found — show empty
    instances = [];
  } else {
    // No template selected — show live scheduled instances
    instances = rawInstances.map((inst) => ({
      id: inst.id,
      taskId: inst.taskId,
      status: inst.status,
      scheduledStartAt: inst.scheduledStartAt?.toISOString() ?? null,
      scheduledEndAt: inst.scheduledEndAt?.toISOString() ?? null,
      task: {
        id: inst.task.id,
        title: inst.task.title,
        durationMin: inst.task.durationMin,
        preferredStartTimeMin: inst.task.preferredStartTimeMin,
      },
      assignees: inst.assignees.map((a) => ({
        id: a.id,
        membership: {
          id: a.membership.id,
          user: { id: a.membership.user.id, name: a.membership.user.name },
        },
      })),
    }));
  }

  const timetableHref = (m: string) =>
    `/orgs/${orgId}/timetable?week=${weekStart}&mode=${m}${selectedTemplateId ? `&template=${selectedTemplateId}` : ""}`;

  return (
    <>
      <Toolbar actions={[{ label: "Templates", href: `/orgs/${orgId}/timetable/templates` }]}>
        {/* Template dropdown */}
        <TemplateSelector
          templates={templates.map((t) => ({ id: t.id, title: t.title }))}
          selectedId={selectedTemplateId}
        />

        {/* Filter (placeholder) */}
        <Button variant="outline" size="sm" className="gap-1.5" disabled>
          Filter <ChevronDown className="h-3.5 w-3.5" />
        </Button>

        {/* Calendar / Simple toggle */}
        <div className="flex rounded-md overflow-hidden border text-sm font-medium">
          <Link
            href={timetableHref("calendar")}
            aria-current={mode === "calendar" ? "page" : undefined}
            className={`px-3 py-1 transition-colors ${
              mode === "calendar"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            Calendar
          </Link>
          <Link
            href={timetableHref("simple")}
            aria-current={mode === "simple" ? "page" : undefined}
            className={`px-3 py-1 border-l transition-colors ${
              mode === "simple"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            Simple
          </Link>
        </div>
      </Toolbar>
      <TimetableClient
        orgId={orgId}
        instances={instances}
        weekStart={weekStart}
        openTimeMin={org?.openTimeMin ?? 360}
        closeTimeMin={org?.closeTimeMin ?? 1320}
        mode={mode}
        selectedTemplateId={selectedTemplateId}
      />
    </>
  );
}
