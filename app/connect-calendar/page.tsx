import ConnectCalendarForm from "@/components/ConnectCalendarForm";

export default function ConnectCalendarPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code ?? "";

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Connect your calendar</h1>
      <p style={{ color: "#666" }}>If you can see this, the page is working.</p>
      <p style={{ color: "#999", marginTop: "8px" }}>Code: {code || "(none)"}</p>
      <hr style={{ margin: "24px 0" }} />
      <ConnectCalendarForm code={code} />
    </div>
  );
}
