"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setRosterCellMembersAction } from "@/app/actions/roster";
import { useActionSidebar } from "@/components/layout/action-sidebar-context";
import type { RosterEntryRow, OrgMember, DayConfigRow } from "./roster-board";

function memberDisplayName(m: OrgMember): string {
  return m.botName ?? m.user?.name ?? "Unknown";
}

function minToTime(min: number | null): string {
  if (min === null) return "";
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMin(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function hoursWorked(startMin: number | null, endMin: number | null): string {
  if (startMin === null || endMin === null) return "";
  const diff = endMin - startMin;
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

type MemberShift = {
  membershipId: string;
  startTime: string; // "HH:MM"
  endTime: string;
};

interface EditCellPanelProps {
  orgId: string;
  weekStart: Date;
  dayIndex: number;
  members: OrgMember[];
  currentEntries: RosterEntryRow[];
  dayConfig: DayConfigRow | null;
  orgOpenTimeMin: number | null;
  orgCloseTimeMin: number | null;
}

export function EditCellPanel({
  orgId,
  weekStart,
  dayIndex,
  members,
  currentEntries,
  dayConfig,
  orgOpenTimeMin,
  orgCloseTimeMin,
}: EditCellPanelProps) {
  const { close } = useActionSidebar();

  // Default shift = day config times, falling back to org times
  const defaultStart = minToTime(dayConfig?.openTimeMin ?? orgOpenTimeMin);
  const defaultEnd = minToTime(dayConfig?.closeTimeMin ?? orgCloseTimeMin);

  const [shifts, setShifts] = useState<MemberShift[]>(
    currentEntries.map((e) => ({
      membershipId: e.membershipId,
      startTime: minToTime(e.shiftStartMin) || defaultStart,
      endTime: minToTime(e.shiftEndMin) || defaultEnd,
    })),
  );
  const [isPending, startTransition] = useTransition();

  const selectedIds = shifts.map((s) => s.membershipId);
  const available = members.filter((m) => !selectedIds.includes(m.id));

  function addMember(id: string) {
    setShifts((prev) => [
      ...prev,
      { membershipId: id, startTime: defaultStart, endTime: defaultEnd },
    ]);
  }

  function removeMember(id: string) {
    setShifts((prev) => prev.filter((s) => s.membershipId !== id));
  }

  function updateShift(id: string, field: "startTime" | "endTime", value: string) {
    setShifts((prev) =>
      prev.map((s) => (s.membershipId === id ? { ...s, [field]: value } : s)),
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setRosterCellMembersAction(
        orgId,
        weekStart,
        dayIndex,
        shifts.map((s) => ({
          membershipId: s.membershipId,
          shiftStartMin: timeToMin(s.startTime),
          shiftEndMin: timeToMin(s.endTime),
        })),
      );
      if (result.ok) {
        close();
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 p-4">
        {/* Member picker */}
        {available.length > 0 && (
          <select
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addMember(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Add member…
            </option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {memberDisplayName(m)}
              </option>
            ))}
          </select>
        )}

        {/* Rostered members with shift times */}
        {shifts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No members rostered.
          </p>
        ) : (
          shifts.map((s) => {
            const member = members.find((m) => m.id === s.membershipId);
            if (!member) return null;
            const worked = hoursWorked(timeToMin(s.startTime), timeToMin(s.endTime));
            return (
              <div key={s.membershipId} className="flex flex-col gap-2 rounded-md border border-border p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate pr-2">{memberDisplayName(member)}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(s.membershipId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Start</label>
                    <Input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => updateShift(s.membershipId, "startTime", e.target.value)}
                      className="h-7 text-xs px-1.5"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">End</label>
                    <Input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => updateShift(s.membershipId, "endTime", e.target.value)}
                      className="h-7 text-xs px-1.5"
                    />
                  </div>
                </div>
                {worked && (
                  <p className="text-xs text-muted-foreground text-right">{worked}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 flex gap-2 justify-end p-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={close}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
