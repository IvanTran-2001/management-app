"use client";

/**
 * RosterBoard — the reusable week × day grid.
 *
 * Exports ROSTER_CELL_WIDTH / ROSTER_DAY_LABEL_WIDTH constants so a future
 * template-mode board can reuse the exact same grid structure.
 *
 * Row colors:
 *   RED    — no members rostered
 *   YELLOW — member count doesn't match recommendedSize
 *   GREEN  — filtered member is rostered on this day
 *   default (white/dark) — fully staffed
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EditCellDialog } from "./edit-cell-dialog";
import { EditDayConfigDialog } from "./edit-day-config-dialog";
import {
  DAY_LABELS,
  ROSTER_CELL_WIDTH,
  ROSTER_DAY_LABEL_WIDTH,
  ROSTER_CELL_MIN_HEIGHT,
} from "./roster-board-constants";

export type RosterEntryRow = {
  id: string;
  membershipId: string;
  weekStart: Date;
  dayIndex: number;
  shiftStartMin: number | null;
  shiftEndMin: number | null;
  membership: {
    id: string;
    botName: string | null;
    user: { name: string | null } | null;
  };
};

export type DayConfigRow = {
  dayIndex: number;
  recommendedSize: number;
  openTimeMin: number | null;
  closeTimeMin: number | null;
};

export type OrgMember = {
  id: string;
  botName: string | null;
  user: { name: string | null } | null;
};

export type RosterBoardProps = {
  orgId: string;
  entries: RosterEntryRow[];
  dayConfigs: DayConfigRow[];
  members: OrgMember[];
  weekStarts: Date[];
  todayMonday: number; // .getTime() of today's Monday
  filterMembershipId: string | null;
  onFilterChange: (id: string | null) => void;
};

function memberName(m: OrgMember): string {
  return m.botName ?? m.user?.name ?? "Unknown";
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function RosterBoard({
  orgId,
  entries,
  dayConfigs,
  members,
  weekStarts,
  todayMonday,
  filterMembershipId,
  onFilterChange,
}: RosterBoardProps) {
  const [editCell, setEditCell] = useState<{
    weekStart: Date;
    dayIndex: number;
  } | null>(null);
  const [editDayConfig, setEditDayConfig] = useState<number | null>(null); // dayIndex

  // Build lookup: "weekStartMs-dayIndex" → RosterEntryRow[]
  const cellMap = new Map<string, RosterEntryRow[]>();
  for (const entry of entries) {
    const key = `${entry.weekStart.getTime()}-${entry.dayIndex}`;
    const existing = cellMap.get(key) ?? [];
    existing.push(entry);
    cellMap.set(key, existing);
  }

  // Day config lookup by dayIndex
  const configMap = new Map<number, DayConfigRow>();
  for (const cfg of dayConfigs) configMap.set(cfg.dayIndex, cfg);

  return (
    <>
      <div
        className="relative"
        style={{
          minWidth: ROSTER_DAY_LABEL_WIDTH + ROSTER_CELL_WIDTH * weekStarts.length,
        }}
      >
        {/* Day rows */}
        {DAY_LABELS.map((label, dayIndex) => {
          const config = configMap.get(dayIndex);
          const recommendedSize = config?.recommendedSize ?? 1;

          return (
            <div
              key={dayIndex}
              className="flex border-b border-border"
              style={{ minHeight: ROSTER_CELL_MIN_HEIGHT }}
            >
              {/* Day label — clicking opens day config editor */}
              <button
                className="shrink-0 flex flex-col items-start justify-center px-3 py-2 border-r border-border hover:bg-muted/60 transition-colors text-left"
                style={{ width: ROSTER_DAY_LABEL_WIDTH }}
                onClick={() => setEditDayConfig(dayIndex)}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  rec. size: {recommendedSize}
                </span>
              </button>

              {/* Week cells */}
              {weekStarts.map((weekStart) => {
                const key = `${weekStart.getTime()}-${dayIndex}`;
                const cellEntries = cellMap.get(key) ?? [];
                const isToday = weekStart.getTime() === todayMonday;

                const isEmpty = cellEntries.length === 0;
                const isMismatch =
                  !isEmpty && cellEntries.length !== recommendedSize;
                const isFiltered =
                  filterMembershipId !== null &&
                  cellEntries.some(
                    (e) => e.membershipId === filterMembershipId,
                  );

                const bg = isFiltered
                  ? "bg-green-200 dark:bg-green-900/40"
                  : isEmpty
                    ? "bg-red-100 dark:bg-red-900/30"
                    : isMismatch
                      ? "bg-yellow-100 dark:bg-yellow-900/30"
                      : "";

                return (
                  <button
                    key={weekStart.getTime()}
                    className={cn(
                      "shrink-0 flex flex-col items-start justify-start gap-0.5 px-2 py-1.5 border-r border-border text-left transition-colors hover:brightness-95",
                      isToday && "ring-2 ring-inset ring-primary/40",
                      bg,
                    )}
                    style={{ width: ROSTER_CELL_WIDTH }}
                    onClick={() => setEditCell({ weekStart, dayIndex })}
                  >
                    {cellEntries.map((e) => {
                      const name =
                        e.membership.botName ??
                        e.membership.user?.name ??
                        "Unknown";
                      const isHighlighted =
                        filterMembershipId === e.membershipId;
                      return (
                        <span
                          key={e.id}
                          className={cn(
                            "text-xs leading-snug",
                            isHighlighted && "font-bold",
                          )}
                        >
                          {name}
                          {e.shiftStartMin !== null && e.shiftEndMin !== null && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              {formatMinutes(e.shiftStartMin)}–
                              {formatMinutes(e.shiftEndMin)}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Edit cell dialog */}
      {editCell && (
        <EditCellDialog
          orgId={orgId}
          weekStart={editCell.weekStart}
          dayIndex={editCell.dayIndex}
          members={members}
          currentEntries={
            cellMap.get(
              `${editCell.weekStart.getTime()}-${editCell.dayIndex}`,
            ) ?? []
          }
          onClose={() => setEditCell(null)}
        />
      )}

      {/* Edit day config dialog */}
      {editDayConfig !== null && (
        <EditDayConfigDialog
          orgId={orgId}
          dayIndex={editDayConfig}
          config={configMap.get(editDayConfig) ?? null}
          onClose={() => setEditDayConfig(null)}
        />
      )}
    </>
  );
}
