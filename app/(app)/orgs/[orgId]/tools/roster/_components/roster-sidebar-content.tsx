/**
 * RosterSidebarContent — page sidebar for `/orgs/[orgId]/tools/roster`.
 */
"use client";

import { ArrowLeft, LayoutTemplate } from "lucide-react";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import { MembersActions } from "../../../memberships/_components/action-sidebar/members-panel-triggers";
import {
  SearchableCombobox,
  type ComboboxItem,
} from "@/components/ui/searchable-combobox";

type Role = { id: string; name: string; color: string };
type OrgMember = { id: string; botName: string | null; user: { name: string | null } | null };

function memberName(m: OrgMember): string {
  return m.botName ?? m.user?.name ?? "Unknown";
}

interface RosterSidebarContentProps {
  orgId: string;
  roles: Role[];
  canManage: boolean;
  members: OrgMember[];
  filterMembershipId: string | null;
  onFilterChange: (id: string | null) => void;
}

export function RosterSidebarContent({
  orgId,
  roles,
  canManage,
  members,
  filterMembershipId,
  onFilterChange,
}: RosterSidebarContentProps) {
  const filterItems: ComboboxItem[] = [
    { id: "", name: "All members" },
    ...members.map((m) => ({ id: m.id, name: memberName(m) })),
  ];
  const selectedMember = members.find((m) => m.id === filterMembershipId);
  const filterLabel = selectedMember ? memberName(selectedMember) : "All members";

  function handleFilterSelect(item: ComboboxItem) {
    onFilterChange(item.id === "" ? null : item.id);
  }
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title row */}
      <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
          Roster
        </span>
      </div>

      {/* Back */}
      <SidebarNavItem
        title="Back"
        url={`/orgs/${orgId}/tools`}
        icon={ArrowLeft}
        isActive={false}
        variant="page"
      />

      {/* Templates */}
      <SidebarNavItem
        title="Templates"
        url={`/orgs/${orgId}/tools/roster/templates`}
        icon={LayoutTemplate}
        isActive={false}
        variant="page"
      />

      {/* Actions */}
      {canManage && (
        <div className="px-3 pt-3 pb-3 border-t border-border">
          <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-1 mb-2">
            Actions
          </p>
          <div className="flex flex-col gap-2">
            <MembersActions orgId={orgId} roles={roles} />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="px-3 pt-3 pb-3 border-t border-border">
        <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-1 mb-2">
          Filter
        </p>
        <SearchableCombobox
          items={filterItems}
          onSelect={handleFilterSelect}
          triggerLabel={filterLabel}
          placeholder="Search members…"
        />
      </div>
    </div>
  );
}
