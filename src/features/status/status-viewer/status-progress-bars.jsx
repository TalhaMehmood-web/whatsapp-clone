"use client";

// Horizontal segment bars at the top of the viewer (one segment per status).
// `progress` is the fill percentage [0..1] for the *current* index.
export function StatusProgressBars({ count, index, progress }) {
  return (
    <div className="absolute left-2 right-2 top-2 z-20 flex gap-1">
      {Array.from({ length: count }).map((_, i) => {
        const fill =
          i < index ? 1 : i === index ? Math.max(0, Math.min(1, progress)) : 0;
        return (
          <div
            key={i}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
