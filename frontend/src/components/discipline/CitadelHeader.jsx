import { useEffect, useState } from "react";
import {
  MASTER_BADGE_COLORS,
  formatCountdownMs,
  getBaselineStatus,
} from "../../utils/disciplineHelpers";

export default function CitadelHeader({
  dashboard,
  onOpenBossArena,
  onToggleSound,
  onRefresh,
  refreshing,
}) {
  const {
    profile,
    overall,
    masterRank,
    cycleInfo,
    combo,
  } = dashboard;

  const [msLeft, setMsLeft] = useState(() =>
    cycleInfo?.cycleEndIso
      ? Math.max(0, new Date(cycleInfo.cycleEndIso).getTime() - Date.now())
      : cycleInfo?.msUntilReset || 0,
  );

  useEffect(() => {
    const computeRemaining = () => {
      if (cycleInfo?.cycleEndIso) {
        return Math.max(
          0,
          new Date(cycleInfo.cycleEndIso).getTime() - Date.now(),
        );
      }
      return 0;
    };

    const timer = setInterval(() => {
      setMsLeft(computeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [cycleInfo?.cycleEndIso]);

  const badgeGradient =
    MASTER_BADGE_COLORS[masterRank?.current?.badge] ||
    MASTER_BADGE_COLORS.Bronze;
  const baselineInfo = getBaselineStatus(profile?.currentBaseline ?? 100);
  const shieldPct = Math.min(100, Math.round(((profile?.shieldHp ?? 100) / 150) * 100));
  const baselinePct = Math.min(
    100,
    Math.max(0, Math.round(((profile?.currentBaseline - 55) / (140 - 55)) * 100)),
  );

  return (
    <section className="rounded-3xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
      {/* Top gradient bar */}
      <div className="bg-gradient-to-r from-primary/15 via-base-200/80 to-secondary/15 px-5 py-5 sm:px-7 border-b border-base-300/70">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Master Rank Crest + Overall Level */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${badgeGradient} border-2 shadow-md flex flex-col items-center justify-center shrink-0`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                Tier {masterRank?.current?.tier || 1}
              </span>
              <span className="text-2xl sm:text-3xl font-black leading-none">
                {overall?.level || 1}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">
                {masterRank?.current?.badge}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-primary badge-sm font-bold">
                  ADMIN CITADEL
                </span>
                <span className="text-xs font-mono text-base-content/60">
                  Cycle: {cycleInfo?.cycleWindowLabel}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content mt-1">
                {masterRank?.current?.name}
              </h1>

              {/* Overall XP Progress */}
              <div className="mt-2 max-w-md">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-base-content/75">
                    Master Level {overall?.level} • {profile?.totalXp?.toLocaleString()} Total XP
                  </span>
                  <span className="text-primary font-mono">
                    {overall?.xpIntoLevel}/{overall?.xpNeededForNext} XP ({overall?.progressPct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-base-300 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${overall?.progressPct || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls: Countdown + Emergency Boss Button */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="px-3.5 py-2 rounded-2xl border border-base-300 bg-base-100/90 flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-base-content/55">
                Next Maghrib Reset
              </span>
              <span className="text-sm sm:text-base font-mono font-extrabold text-primary">
                {formatCountdownMs(msLeft)}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenBossArena}
              className="btn btn-error btn-sm sm:btn-md gap-2 font-bold shadow-sm hover:scale-[1.02] transition-transform"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Fight an Urge</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              title={profile?.settings?.soundEnabled ? "Mute SFX" : "Enable SFX"}
              className={`btn btn-sm sm:btn-md btn-square border border-base-300 ${
                profile?.settings?.soundEnabled
                  ? "bg-base-100 text-primary"
                  : "bg-base-200 text-base-content/40"
              }`}
            >
              {profile?.settings?.soundEnabled ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="btn btn-sm sm:btn-md btn-ghost border border-base-300"
              title="Refresh dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Vital Stats Grid: Dopamine Baseline, Shield HP, Streaks, Combo, CoC Rank Gate */}
      <div className="p-5 sm:px-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Dopamine Baseline Meter */}
        <div className="p-3.5 rounded-2xl border border-base-300 bg-base-200/40">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-base-content/70 uppercase tracking-wide">
              Dopamine Baseline
            </span>
            <span className={`font-mono text-sm ${baselineInfo.color}`}>
              {profile?.currentBaseline} / 100
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-base-300 mt-2 overflow-hidden relative">
            <div
              className={`h-full ${baselineInfo.barColor} transition-all duration-500`}
              style={{ width: `${baselinePct}%` }}
            />
          </div>
          <p className={`text-[11px] font-medium mt-1.5 ${baselineInfo.color}`}>
            {baselineInfo.label}
          </p>
        </div>

        {/* Citadel Shield HP & Combo */}
        <div className="p-3.5 rounded-2xl border border-base-300 bg-base-200/40">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-base-content/70 uppercase tracking-wide">
              Shield HP & Combo
            </span>
            <span className="font-mono text-sm text-info">
              {profile?.shieldHp} / 150 HP
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-base-300 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                profile?.shieldHp < 65 ? "bg-error" : "bg-info"
              }`}
              style={{ width: `${shieldPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="font-semibold text-base-content/75">
              Combo:{" "}
              <span className="text-amber-500 font-bold">
                {combo?.multiplier?.toFixed(2)}x ({combo?.count || 0} chain)
              </span>
            </span>
            <span className="font-semibold text-primary">
              Streak: {combo?.streakMultiplier?.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* 3 Streaks: Anchor, Clean, Guarded Tongue */}
        <div className="p-3.5 rounded-2xl border border-base-300 bg-base-200/40">
          <div className="text-xs font-bold text-base-content/70 uppercase tracking-wide mb-2">
            Active Maghrib Streaks
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-base-100 border border-base-300 py-1.5 px-1">
              <div className="text-base font-black text-emerald-500">
                {profile?.anchorStreak || 0}d
              </div>
              <div className="text-[10px] font-semibold text-base-content/60">
                Anchor
              </div>
            </div>
            <div className="rounded-xl bg-base-100 border border-base-300 py-1.5 px-1">
              <div className="text-base font-black text-amber-500">
                {profile?.cleanStreak || 0}d
              </div>
              <div className="text-[10px] font-semibold text-base-content/60">
                Clean
              </div>
            </div>
            <div className="rounded-xl bg-base-100 border border-base-300 py-1.5 px-1">
              <div className="text-base font-black text-violet-500">
                {profile?.tongueStreak || 0}d
              </div>
              <div className="text-[10px] font-semibold text-base-content/60">
                Tongue
              </div>
            </div>
          </div>
        </div>

        {/* CoC Town-Hall Style Master Rank Upgrade Gate */}
        <div className="p-3.5 rounded-2xl border border-base-300 bg-base-200/40">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-base-content/70 uppercase tracking-wide">
              Next Tier Gate
            </span>
            <span className="text-[11px] font-mono text-primary">
              Avg Lv {masterRank?.avgLevel} | Floor Lv {masterRank?.floorLevel}
            </span>
          </div>
          {masterRank?.next ? (
            <>
              <div className="text-xs font-bold text-base-content truncate">
                Target: {masterRank.next.name}
              </div>
              <div className="mt-1 space-y-0.5 max-h-12 overflow-y-auto">
                {masterRank.blockers.slice(0, 2).map((b, i) => (
                  <p key={i} className="text-[11px] text-warning font-medium leading-tight">
                    • {b}
                  </p>
                ))}
                {masterRank.blockers.length > 2 && (
                  <p className="text-[10px] text-base-content/60">
                    +{masterRank.blockers.length - 2} more realm requirement(s)
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-emerald-500 mt-1">
              Maximum Master Tier Unlocked — Keep Guarding Your Balance!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
