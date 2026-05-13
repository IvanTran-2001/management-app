"use client";

/**
 * RosterPageClient — owns the filter state so it can be shared between
 * the page sidebar (filter list) and the board (highlight cells).
 * Registers its own sidebar so it can pass live filter state down.
 */

import { useState } from "react";
import { RegisterPageSidebar } from "@/components/layout/page-sidebar-context";
import { RosterSidebarContent } from "./roster-sidebar-content";
import { RosterClient } from "./roster-client";
import type { RosterEntryRow, DayConfigRow, OrgMember } from "./roster-board";

interface RosterPageClientProps {
  orgId: string;
  entries: RosterEntryRow[];
  dayConfigs: DayConfigRow[];
  members: OrgMember[];
}

export function RosterPageClient({
  orgId,
  entries,
  dayConfigs,
  members,
}: RosterPageClientProps) {
  const [filterMembershipId, setFilterMembershipId] = useState<string | null>(
    null,
  );

  return (
    <>
      <RegisterPageSidebar
        content={
          <RosterSidebarContent
            orgId={orgId}
            members={members}
            filterMembershipId={filterMembershipId}
            onFilterChange={setFilterMembershipId}
          />
        }
      />

      <RosterClient
        orgId={orgId}
        entries={entries}
        dayConfigs={dayConfigs}
        members={members}
        filterMembershipId={filterMembershipId}
      />
    </>
  );
}
