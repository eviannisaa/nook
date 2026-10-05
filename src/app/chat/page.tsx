import { ChatPanel } from "@/components/ChatPanel";

const C = {
  bg: "var(--bg-color)",
  border: "var(--border-color)",
  muted: "var(--muted-color)",
  fg: "var(--fg-color)",
  green: "var(--green-color)",
  red: "var(--red-color)",
};

export default function LiveChat() {
  return (
    <div
      style={{
        backgroundColor: C.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <div className="px-6 pt-12 pb-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              color: C.green,
            }}
          >
            // 04
          </span>
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "clamp(2rem,4vw,2.8rem)",
              fontWeight: 700,
              color: C.fg,
              margin: 0,
            }}
          >
            live_chat
          </h1>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
            color: C.muted,
          }}
        >
          <span style={{ color: C.red }}>./</span>ask about background · work · professional
          experience
        </p>
      </div>

      <div className="px-6 pb-10 max-w-5xl mx-auto w-full flex flex-col gap-4 flex-1">
        <ChatPanel />
      </div>
    </div>
  );
}
