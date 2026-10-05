import { JsonBlock, type JsonRow } from "@/components/JsonBlock";

function parse(lines: string[]): JsonRow[] {
  const out: JsonRow[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*\*\s*@(\w+)\s+(.*)$/);
    if (!m) continue;
    const parts = m[2]
      .split("·")
      .map((x) => x.trim())
      .filter(Boolean);
    out.push([m[1], parts.length > 1 ? parts : m[2].trim()]);
  }
  return out;
}

export function ProfileJson({ lines, className = "" }: { lines: string[]; className?: string }) {
  return <JsonBlock rows={parse(lines)} className={className} />;
}
