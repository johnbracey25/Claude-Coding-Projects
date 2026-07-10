import { Suspense } from "react";
import ConnectCalendarForm from "@/components/ConnectCalendarForm";

export default function ConnectCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f4ee]">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      }
    >
      <ConnectCalendarForm />
    </Suspense>
  );
}
