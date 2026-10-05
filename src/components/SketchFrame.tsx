export function SketchFrame() {
  return (
    <svg className="frame" preserveAspectRatio="none" aria-hidden="true">
      <rect
        x="3"
        y="3"
        style={{ width: "calc(100% - 6px)", height: "calc(100% - 6px)" }}
        strokeWidth="1.5"
        strokeDasharray="9 4 5 3 11 4"
        strokeLinecap="round"
        rx="4"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="7" cy="7" r="1.5" opacity="0.5" />
      <circle cy="7" r="1.5" style={{ cx: "calc(100% - 7px)" }} opacity="0.5" />
      <circle cx="7" r="1.5" style={{ cy: "calc(100% - 7px)" }} opacity="0.5" />
      <circle r="1.5" style={{ cx: "calc(100% - 7px)", cy: "calc(100% - 7px)" }} opacity="0.5" />
    </svg>
  );
}
