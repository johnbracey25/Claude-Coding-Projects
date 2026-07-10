import ConnectCalendarForm from "@/components/ConnectCalendarForm";

export default function ConnectCalendarPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  return <ConnectCalendarForm code={searchParams.code ?? ""} />;
}
