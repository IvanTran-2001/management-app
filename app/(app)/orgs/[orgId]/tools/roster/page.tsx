/**
 * RosterPage — fetches roster data and renders the interactive board.
 */
import { requireOrgMemberPage } from "@/lib/authz";
import { Toolbar } from "@/components/layout/toolbar";
import {
  getRosterEntries,
  getRosterDayConfigs,
  getOrgMembersForRoster,
} from "@/lib/services/roster";
import { RosterPageClient } from "./_components/roster-page-client";

// Pre-fetch 8 weeks centred on today so the initial render has data
// without a client round-trip. The client can navigate further freely.
function getInitialWeekStarts(): Date[] {
  const today = new Date();
  const day = today.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i * 7);
    return d;
  });
}

export default async function RosterPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireOrgMemberPage(orgId);

  const weekStarts = getInitialWeekStarts();

  const [entries, dayConfigs, members] = await Promise.all([
    getRosterEntries(orgId, weekStarts),
    getRosterDayConfigs(orgId),
    getOrgMembersForRoster(orgId),
  ]);

  return (
    <>
      <Toolbar>
        <h1 className="text-sm font-semibold">Roster</h1>
      </Toolbar>

      <RosterPageClient
        orgId={orgId}
        entries={entries}
        dayConfigs={dayConfigs}
        members={members}
      />
    </>
  );
}
