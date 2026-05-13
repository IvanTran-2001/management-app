"use client";

/**
 * RosterClient — client shell for the Roster board.
 *
 * Owns:
 *  - Week navigation (prev / today / next, showing WEEKS_SHOWN columns at once)
 *  - Filter by member (highlights matching cells in green, dims others)
 *  - Renders RosterBoard with derived props
 */

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RosterBoard } from "./roster-board";
import type { RosterBoardProps } from "./roster-board";

const WEEKS_SHOWN = 5;

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) =>
    `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

type Props = Omit<RosterBoardProps, "weekStarts" | "todayMonday" | "onFilterChange"> & {
  filterMembershipId: string | null;
  onFilterChange?: (id: string | null) => void;
};

export function RosterClient({
  filterMembershipId,
  onFilterChange,
  ...boardProps
}: Props) {
  // Anchor: the Monday of the leftmost visible column
  const [anchorMonday, setAnchorMonday] = useState<Date>(() =>
    getMondayOfWeek(new Date()),
  );

  const weekStarts = useMemo(() => {
    return Array.from({ length: WEEKS_SHOWN }, (_, i) =>
      addWeeks(anchorMonday, i),
    );
  }, [anchorMonday]);

  const todayMonday = getMondayOfWeek(new Date()).getTime();

  function goToToday() {
    setAnchorMonday(getMondayOfWeek(new Date()));
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Week navigation toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnchorMonday((d) => addWeeks(d, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnchorMonday((d) => addWeeks(d, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Week range labels */}
        <div className="flex gap-1 ml-2 text-xs text-muted-foreground">
          {weekStarts.map((w) => (
            <span
              key={w.getTime()}
              className="w-[160px] text-center font-medium truncate"
            >
              {formatWeekRange(w)}
            </span>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto">
        <RosterBoard
          {...boardProps}
          weekStarts={weekStarts}
          todayMonday={todayMonday}
          filterMembershipId={filterMembershipId ?? null}
          onFilterChange={onFilterChange ?? (() => {})}
        />
      </div>
    </div>
  );
}
