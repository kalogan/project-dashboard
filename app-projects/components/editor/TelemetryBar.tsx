"use client";

import { useEffect, useState } from "react";

/**
 * A 24px-tall telemetry bar anchored to the bottom of the viewport in the
 * local CMS. Polls /api/telemetry every 10s. Strictly monochrome, with a
 * single high-contrast accent reserved for breached thresholds.
 */

interface Telemetry {
  disk: { human: string; availableBytes: number; critical: boolean };
  api: { limit: number; used: number; remaining: number };
  media: { active: boolean; percent: number; file: string; phase: string };
}

export default function TelemetryBar() {
  const [data, setData] = useState<Telemetry | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/telemetry", { cache: "no-store" });
        const json = (await res.json()) as Telemetry;
        if (alive) setData(json);
      } catch {
        // Transient — keep the last good reading.
      }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const apiLow = data ? data.api.remaining < 3 : false;
  const diskCritical = data?.disk.critical ?? false;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex h-6 items-center gap-6 border-t border-gray-800 bg-black px-4 font-mono text-[0.65rem] uppercase tracking-widest">
      <span className={diskCritical ? "bg-[#7f1d1d] px-1 font-bold text-white" : "text-gray-400"}>
        Disk: {data?.disk.human ?? "—"}
      </span>

      <span className={apiLow ? "blink font-bold text-white" : "text-gray-400"}>
        Gemini: {data ? `${data.api.remaining}/${data.api.limit} RPM` : "—"}
      </span>

      <span className="text-gray-400">
        {data?.media.active
          ? `${data.media.phase} ${data.media.percent}% — ${data.media.file}`
          : "Media: idle"}
      </span>
    </div>
  );
}
