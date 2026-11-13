import { useMemo } from "react";

function shiftDateKey(dateKey, deltaDays) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export default function AnalyticsAndHeatmap({ dashboard }) {
  const {
    ghostComparison,
    heatmap = [],
    trend30 = [],
    topLeaks = [],
    todaySummary,
    cycleInfo,
  } = dashboard;

  // Build continuous 168-day (24 weeks x 7 days) heatmap matrix ending on current cycle dateKey
  const heatmapCells = useMemo(() => {
    const map = new Map(heatmap.map((h) => [h.dateKey, h]));
    const endKey = cycleInfo?.dateKey;
    if (!endKey) return [];
    const cells = [];
    for (let i = 167; i >= 0; i -= 1) {
      const k = shiftDateKey(endKey, -i);
      const data = map.get(k);
      cells.push({
        dateKey: k,
        data: data || null,
      });
    }
    return cells;
  }, [heatmap, cycleInfo?.dateKey]);

  // SVG polyline points for 30-day Baseline (anchored at 100)
  const baselineChart = useMemo(() => {
    if (!trend30.length) return null;
    const width = 620;
    const height = 160;
    const pad = 16;
    const minB = 55;
    const maxB = 135;

    const toY = (b) => {
      const clamped = Math.max(minB, Math.min(maxB, b));
      const norm = (clamped - minB) / (maxB - minB);
      return height - pad - norm * (height - pad * 2);
    };

    const points = trend30
      .map((pt, idx) => {
        const x =
          trend30.length === 1
            ? width / 2
            : pad + (idx / (trend30.length - 1)) * (width - pad * 2);
        const y = toY(pt.closingBaseline ?? 100);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const baseline100Y = toY(100);

    return { width, height, points, baseline100Y };
  }, [trend30]);

  const tongueWinToday = todaySummary?.tongueControlCount || 0;
  const tongueLeakToday = todaySummary?.tongueLeakCount || 0;

  return (
    <div className="space-y-6">
      {/* Beat Your Ghost Comparison */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold tracking-tight">
            Beat Your Ghost — Self-Rivalry
          </h2>
          <p className="text-xs text-base-content/65">
            Compare your current Maghrib cycle against your own past benchmarks.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="text-xs font-bold text-primary uppercase">This Cycle</div>
            <div className="text-2xl font-black font-mono mt-1">
              {ghostComparison?.todayNetXp >= 0
                ? `+${ghostComparison.todayNetXp}`
                : ghostComparison?.todayNetXp}{" "}
              XP
            </div>
          </div>

          <div className="p-4 rounded-xl border border-base-300 bg-base-200/40">
            <div className="text-xs font-bold text-base-content/60 uppercase">
              Yesterday Ghost
            </div>
            <div className="text-2xl font-black font-mono mt-1">
              {ghostComparison?.yesterdayNetXp >= 0
                ? `+${ghostComparison.yesterdayNetXp}`
                : ghostComparison?.yesterdayNetXp}{" "}
              XP
            </div>
          </div>

          <div className="p-4 rounded-xl border border-base-300 bg-base-200/40">
            <div className="text-xs font-bold text-base-content/60 uppercase">
              7-Cycle Average
            </div>
            <div className="text-2xl font-black font-mono mt-1">
              {ghostComparison?.avg7DayXp >= 0
                ? `+${ghostComparison.avg7DayXp}`
                : ghostComparison?.avg7DayXp}{" "}
              XP
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <div className="text-xs font-bold text-amber-600 uppercase">
              All-Time Best Cycle
            </div>
            <div className="text-2xl font-black font-mono text-amber-500 mt-1">
              +{ghostComparison?.bestDayXp || 0} XP
            </div>
          </div>
        </div>
      </section>

      {/* 168-Day Maghrib Discipline Heatmap */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Maghrib-to-Maghrib Consistency Heatmap (24 Weeks)
            </h2>
            <p className="text-xs text-base-content/65">
              Hover any square to inspect XP, Baseline, Guarded Tongue status, and 4-Pillar balance.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-base-300 inline-block" /> Idle
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-error inline-block" /> Crash/Neg
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-400/70 inline-block" /> Positive
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" /> 4-Pillar
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[600px]">
            {heatmapCells.map((cell) => {
              const d = cell.data;
              let bg = "bg-base-300/70";
              if (d) {
                if ((d.severeTrapCount || 0) > 0 || (d.netXp || 0) < 0) {
                  bg = "bg-error/85";
                } else if (d.balancedBonusAwarded) {
                  bg = "bg-emerald-600 ring-1 ring-amber-400/70";
                } else if ((d.netXp || 0) >= 120) {
                  bg = "bg-emerald-500";
                } else if ((d.netXp || 0) > 0) {
                  bg = "bg-emerald-400/65";
                } else {
                  bg = "bg-amber-400/60";
                }
              }

              const tip = d
                ? `${cell.dateKey}: ${d.netXp >= 0 ? "+" : ""}${d.netXp} XP | Baseline ${d.closingBaseline} | Tongue +${d.tongueControlCount}/-${d.tongueLeakCount}`
                : `${cell.dateKey}: No logs`;

              return (
                <div
                  key={cell.dateKey}
                  title={tip}
                  className={`w-4 h-4 rounded-xs transition-transform hover:scale-125 ${bg}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Grid: Baseline Trend + Hifz al-Lisan & Top Leaks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 rounded-2xl border border-base-300 bg-base-100 p-5">
          <h2 className="text-base font-extrabold tracking-tight">
            30-Cycle Dopamine Baseline Curve (100 Anchor)
          </h2>
          <p className="text-xs text-base-content/65 mb-3">
            Dashed line = resting baseline (100). Earned tonic acts lift stability; high-spike traps cause crashes.
          </p>

          {baselineChart ? (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${baselineChart.width} ${baselineChart.height}`}
                className="w-full h-44 bg-base-200/40 rounded-xl border border-base-300"
              >
                <line
                  x1="0"
                  y1={baselineChart.baseline100Y}
                  x2={baselineChart.width}
                  y2={baselineChart.baseline100Y}
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeDasharray="4 4"
                />
                <polyline
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={baselineChart.points}
                />
              </svg>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-base-300 text-xs text-base-content/60">
              Log acts across cycles to see your dopamine baseline trajectory.
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-base-300 bg-base-100 p-5 space-y-4">
          {/* Tongue Control Highlight */}
          <div className="p-3.5 rounded-xl border border-violet-500/30 bg-violet-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-violet-500">
                Hifz al-Lisan (Tongue Audit)
              </span>
              <span className="text-xs font-mono font-bold">
                Today: +{tongueWinToday} Guarded / -{tongueLeakToday} Leaks
              </span>
            </div>
            <p className="text-[11px] text-base-content/75 mt-1">
              Every silent pause and swallowed boast reinforces your Akhlaq & Tongue Mastery rank.
            </p>
          </div>

          {/* Top Leaks */}
          <div>
            <h3 className="text-sm font-extrabold mb-2">
              Top XP & Baseline Leaks (Last 30 Cycles)
            </h3>
            {topLeaks.length === 0 ? (
              <p className="text-xs text-emerald-500 font-semibold p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                Zero harmful leaks recorded in the last 30 cycles!
              </p>
            ) : (
              <div className="space-y-2">
                {topLeaks.map((leak) => (
                  <div
                    key={leak.key}
                    className="p-2.5 rounded-xl border border-error/25 bg-error/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-base-content truncate">
                        {leak.title}
                      </div>
                      <div className="text-[11px] text-base-content/60 font-mono">
                        {leak.count}x • -{leak.baselineLost} baseline
                      </div>
                    </div>
                    <span className="font-mono font-black text-error shrink-0">
                      -{leak.xpLost} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
