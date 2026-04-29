import { Suspense } from "react";
import NewOrgPage from "./new-org-client";
import { TIMEZONES } from "@/lib/timezones";

export default function Page() {
  return (
    <Suspense>
      <NewOrgPage timezones={TIMEZONES} />
    </Suspense>
  );
}
