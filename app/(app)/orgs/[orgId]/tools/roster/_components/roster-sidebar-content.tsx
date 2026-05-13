/**
 * RosterSidebarContent — page sidebar for `/orgs/[orgId]/tools/roster`.
 */
"use client";

import Link from "next/link";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

type OrgMember = {
  id: string;
  botName: string | null;
  user: { name: string | null } | null;
};

interface RosterSidebarContentProps {
  orgId: string;
  members?: OrgMember[];
  filterMembershipId?: string | null;
  onFilterChange?: (id: string | null) => void;
}

function memberName(m: OrgMember): string {
  return m.botName ?? m.user?.name ?? "Unknown";
}

export function RosterSidebarContent({
  orgId,
  members = [],
  filterMembershipId,
  onFilterChange,
}: RosterSidebarContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title row */}
      <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
          Roster
        </span>
      </div>

      {/* Back */}
      <Link
        href={`/orgs/${orgId}/tools`}
        className="flex items-center gap-2 h-12 px-4 text-sm border-b border-border text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Templates */}
      <Link
        href={`/orgs/${orgId}/tools/roster/templates`}
        className="flex items-center gap-2 h-12 px-4 text-sm border-b border-border text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors shrink-0"
      >
        <LayoutTemplate className="h-4 w-4" />
        Templates
      </Link>

      {/* Filters */}
      {members.length > 0 && onFilterChange && (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
            Filter
          </span>
          <div className="flex flex-col gap-1">
            <button
              className={`text-xs text-left px-2 py-1 rounded transition-colors ${
                filterMembershipId === null
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-muted/50"
              }`}
              onClick={() => onFilterChange(null)}
            >
              All members
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                className={`text-xs text-left px-2 py-1 rounded transition-colors ${
                  filterMembershipId === m.id
                    ? "bg-green-100 dark:bg-green-900/40 font-semibold text-green-800 dark:text-green-300"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-muted/50"
                }`}
                onClick={() =>
                  onFilterChange(filterMembershipId === m.id ? null : m.id)
                }
              >
                {memberName(m)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
