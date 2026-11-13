import { REALM_STYLES } from "../../utils/disciplineHelpers";

const CHEST_TIERS = [
  { tier: 25, title: "25% Supply", reward: "+20 XP", accent: "text-amber-600" },
  { tier: 50, title: "50% Silver", reward: "+35 XP • +5 HP", accent: "text-sky-500" },
  {
    tier: 100,
    title: "100% Barakah",
    reward: "+75 XP • +12 HP • Freeze",
    accent: "text-emerald-500",
  },
];

export default function QuestsAndChestsBar({
  dailyQuests,
  weeklyMission,
  todaySummary,
  streakFreezes = 0,
  onClaimChest,
  claimingTier,
}) {
  const claimedSet = new Set(todaySummary?.claimedChests || []);
  const pct = dailyQuests?.completionPct || 0;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* Daily Quests (8 cols) */}
      <div className="xl:col-span-8 p-5 rounded-2xl border border-base-300 bg-base-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-base-content">
              Daily Maghrib Missions ({dailyQuests?.completedCount || 0}/4)
            </h2>
            <p className="text-xs text-base-content/60">
              Complete quests in the current Maghrib cycle to unlock supply chests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {todaySummary?.balancedBonusAwarded && (
              <span className="badge badge-success badge-sm font-bold">
                +50 XP 4-Pillar Bonus Active!
              </span>
            )}
            <span className="badge badge-primary badge-outline font-mono font-bold">
              {pct}% Complete
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(dailyQuests?.quests || []).map((q) => {
            const style = REALM_STYLES[q.realm] || REALM_STYLES.imaan;
            return (
              <div
                key={q.key}
                className={`p-3 rounded-xl border transition-all ${
                  q.completed
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : q.failed
                      ? "border-error/40 bg-error/5"
                      : "border-base-300 bg-base-200/35"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-base-content mt-0.5">
                      {q.title}
                    </h3>
                    <p className="text-[11px] text-base-content/65 mt-0.5 leading-snug">
                      {q.description}
                    </p>
                  </div>
                  <span
                    className={`badge badge-xs font-bold shrink-0 ${
                      q.completed
                        ? "badge-success"
                        : q.failed
                          ? "badge-error"
                          : "badge-ghost border-base-300"
                    }`}
                  >
                    {q.completed ? "Done ✓" : q.failed ? "Broken" : `${q.current}/${q.target}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supply Chests + Weekly Epic Quest (4 cols) */}
      <div className="xl:col-span-4 p-5 rounded-2xl border border-base-300 bg-base-100 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-extrabold tracking-tight">
              Barakah Supply Chests
            </h2>
            <span className="text-xs font-mono text-base-content/65">
              Freezes: {streakFreezes}/3
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-base-300 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {CHEST_TIERS.map((c) => {
              const claimed = claimedSet.has(c.tier);
              const unlocked = pct >= c.tier;
              const canClaim = unlocked && !claimed;

              return (
                <button
                  key={c.tier}
                  type="button"
                  disabled={!canClaim || claimingTier === c.tier}
                  onClick={() => onClaimChest(c.tier)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between gap-1 ${
                    claimed
                      ? "border-emerald-500/30 bg-emerald-500/10 opacity-75"
                      : canClaim
                        ? "border-amber-400 bg-amber-500/15 shadow-sm ring-2 ring-amber-400/30 hover:scale-[1.03] cursor-pointer animate-pulse"
                        : "border-base-300 bg-base-200/40 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span className={`text-xs font-extrabold ${c.accent}`}>
                    {c.title}
                  </span>
                  <span className="text-[10px] text-base-content/70 leading-tight">
                    {c.reward}
                  </span>
                  <span className="text-[10px] font-bold uppercase mt-0.5">
                    {claimed ? "Claimed ✓" : canClaim ? "OPEN!" : "Locked"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly Epic Mission */}
        <div className="p-3 rounded-xl border border-base-300 bg-base-200/50">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-primary uppercase tracking-wide">
              7-Cycle Weekly Epic
            </span>
            <span className="font-mono text-base-content/75">
              {weeklyMission?.weekNetXp || 0} XP
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-base-content/75">
            <span>
              Clean Cycles:{" "}
              <strong>
                {weeklyMission?.cleanDays || 0}/{weeklyMission?.cleanDaysTarget || 5}
              </strong>
            </span>
            <span>
              Raids & Bosses:{" "}
              <strong>
                {weeklyMission?.battles || 0}/{weeklyMission?.battlesTarget || 3}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
