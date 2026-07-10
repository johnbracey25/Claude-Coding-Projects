import type { Metadata } from "next";
import ConnectCalendarForm from "@/components/ConnectCalendarForm";

export const metadata: Metadata = {
  title: "Connect Your Calendar",
};

export default function CalendarHelpPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code ?? "";
  return <ConnectCalendarForm code={code} />;
}
