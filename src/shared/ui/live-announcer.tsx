import { useSyncExternalStore } from "react";

import { currentAnnouncement, subscribeAnnouncements } from "@/shared/lib/announce";

/** The live region behind `announce()`. Mounted once, in the root layout. */
export function LiveAnnouncer() {
  const text = useSyncExternalStore(subscribeAnnouncements, currentAnnouncement);
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  );
}
