export type JsonRow = [key: string, value: string | string[]];

const MONO = "'JetBrains Mono', monospace";
const PUNCT = { color: "var(--muted-color)", opacity: 0.5 };

export function JsonBlock({
  rows,
  name,
  className = "",
  keyWidth = "6.4rem",
}: {
  rows?: JsonRow[];
  name?: string;
  className?: string;
  keyWidth?: string;
}) {
  return (
    <div
      className={className}
      style={{ fontFamily: MONO, fontSize: "0.72rem", lineHeight: "1.8rem" }}
    >
      <div className="about-line">
        {name ? (
          <>
            <span style={{ color: "var(--muted-color)" }}>const </span>
            <span style={{ color: "var(--fg-color)" }}>{name}</span>
            <span style={PUNCT}> = {"{"}</span>
          </>
        ) : (
          <span style={PUNCT}>{"{"}</span>
        )}
      </div>

      {(rows ?? []).map(([k, v], i) => (
        <div key={k} className="about-line flex" style={{ paddingLeft: "1.4rem" }}>
          <span className="shrink-0" style={{ width: keyWidth, color: "var(--red-color)" }}>
            &quot;{k}&quot;
            <span style={PUNCT}>:</span>
          </span>
          <span className="min-w-0" style={{ color: "var(--fg-color)" }}>
            {Array.isArray(v) ? (
              <>
                <span style={PUNCT}>[</span>
                {v.map((item, j) => (
                  <span key={item}>
                    &quot;{item}&quot;
                    {j < v.length - 1 && <span style={PUNCT}>, </span>}
                  </span>
                ))}
                <span style={PUNCT}>]</span>
              </>
            ) : (
              <>&quot;{v}&quot;</>
            )}
            {i < (rows ?? []).length - 1 && <span style={PUNCT}>,</span>}
          </span>
        </div>
      ))}

      <div className="about-line" style={PUNCT}>
        {"}"}
      </div>
    </div>
  );
}
