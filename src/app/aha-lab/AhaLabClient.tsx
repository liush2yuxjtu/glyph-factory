// One review implementation for the Next development route and the static preview.
// The production route guard remains in page.tsx; production static builds exclude it.
export default function AhaLabClient() {
  return (
    <iframe
      title="Aha Lab · 28 个真实状态与动作核验"
      src="/aha.html"
      style={{ display: "block", width: "100%", minHeight: "100vh", border: 0 }}
    />
  );
}
