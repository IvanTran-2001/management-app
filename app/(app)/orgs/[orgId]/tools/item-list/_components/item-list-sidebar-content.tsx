"use client";

import { ArrowLeft } from "lucide-react";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";

export function ItemListSidebarContent({ orgId }: { orgId: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title row */}
      <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
          Item List
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
    </div>
  );
}
