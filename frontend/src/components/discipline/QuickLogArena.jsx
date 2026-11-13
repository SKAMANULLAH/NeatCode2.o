import { useMemo, useState } from "react";
import {
  ACTION_TIER_META,
  CATEGORY_META,
  REALM_STYLES,
} from "../../utils/disciplineHelpers";

const POPULAR_TAGS = [
  "tongue-control",
  "study-marathon",
  "extra-ibadah",
  "salah",
  "quran",
  "dawah",
  "dsa",
  "deep-study",
  "urge-defeated",
  "dopamine-reset",
  "tongue-leak",
  "severe-trap",
];

function ActivityActionCard({
  act,
  loggedCount,
  onLog,
  onTogglePin,
  loggingId,
  compact = false,
}) {
  const [intensityKey, setIntensityKey] = useState(
    act.intensityOptions?.[0]?.key || "standard",
  );
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const isHarmful = act.polarity === "harmful";
  const capReached = act.dailyCap > 0 && loggedCount >= act.dailyCap;
  const realmStyle = REALM_STYLES[act.primaryRealm] || REALM_STYLES.imaan;
  const tierMeta = ACTION_TIER_META[act.action_tier] || ACTION_TIER_META.keep_and_protect;

  const selectedIntensity = act.supportsIntensity
    ? act.intensityOptions?.find((o) => o.key === intensityKey) ||
      act.intensityOptions?.[0]
    : null;
  const displayXp = Math.round(
    act.baseXp * (selectedIntensity?.multiplier || 1),
  );

  const handleTrigger = async () => {
    const ok = await onLog(act._id, intensityKey, note);
    if (ok) {
      setNote("");
      setShowNote(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-base-100 transition-all flex flex-col justify-between ${
        compact ? "p-3.5" : "p-4"
      } ${
        isHarmful
          ? "border-error/25 hover:border-error/50"
          : "border-base-300 hover:border-primary/40"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${tierMeta.className}`}
            >
              {tierMeta.label}
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${realmStyle.bgSoft} ${realmStyle.text}`}
            >
              {realmStyle.label}
            </span>
            {act.dailyCap > 0 && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  capReached
                    ? "bg-success/15 text-success border-success/30 font-bold"
                    : "bg-base-200 text-base-content/65 border-base-300"
                }`}
              >
                {loggedCount}/{act.dailyCap}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-sm font-black font-mono ${
                isHarmful ? "text-error" : "text-emerald-500"
              }`}
            >
              {displayXp >= 0 ? `+${displayXp}` : displayXp} XP
            </span>
            <button
              type="button"
              onClick={() => onTogglePin(act)}
              title={act.isPinned ? "Unpin from Core Scorecard" : "Pin to Core Scorecard"}
              className={`btn btn-xs btn-ghost px-1 ${
                act.isPinned ? "text-amber-500" : "text-base-content/30"
              }`}
            >
              ★
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-base-content mt-2 leading-snug">
          {act.name}
        </h3>

        {!compact && (
          <>
            <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
              {act.impact_on_goal}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] font-mono text-base-content/60">
              <span>
                Peak: {act.peak_min}-{act.peak_max}
              </span>
              <span>
                Aftermath: {act.aftermath_baseline_min}-{act.aftermath_baseline_max}
              </span>
              {act.has_crash && (
                <span className="text-error font-bold">Crash Risk!</span>
              )}
            </div>
            {act.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {act.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-base-200 text-base-content/65"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 pt-2.5 border-t border-base-300/60 space-y-2">
        {act.supportsIntensity && act.intensityOptions?.length > 0 && (
          <select
            value={intensityKey}
            onChange={(e) => setIntensityKey(e.target.value)}
            className="select select-bordered select-xs w-full font-medium"
          >
            {act.intensityOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.multiplier}x)
              </option>
            ))}
          </select>
        )}

        {showNote && (
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional reflection note..."
            className="input input-bordered input-xs w-full"
          />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={capReached || loggingId === act._id}
            onClick={handleTrigger}
            className={`btn btn-xs sm:btn-sm flex-1 font-bold ${
              capReached
                ? "btn-disabled"
                : isHarmful
                  ? "btn-outline btn-error"
                  : "btn-primary"
            }`}
          >
            {loggingId === act._id
              ? "Saving..."
              : capReached
                ? "Completed ✓"
                : isHarmful
                  ? "Log Relapse / Leak"
                  : "Log Victory"}
          </button>
          <button
            type="button"
            onClick={() => setShowNote((s) => !s)}
            className="btn btn-xs sm:btn-sm btn-ghost border border-base-300"
            title="Add reflection note"
          >
            ✎
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuickLogArena({
  dashboard,
  selectedRealm,
  onSelectRealm,
  backdateDays,
  onChangeBackdate,
  onLogActivity,
  onDeleteLog,
  onTogglePin,
  loggingId,
  deletingLogId,
}) {
  const {
    activities = [],
    todayLogs = [],
    dailyActivityCounts = {},
    recoverySuggestions = [],
    profile,
    activeDateKey,
  } = dashboard;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [polarityFilter, setPolarityFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  const pinnedActivities = useMemo(
    () => activities.filter((a) => a.isPinned),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      if (selectedRealm !== "all" && a.primaryRealm !== selectedRealm) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (polarityFilter !== "all" && a.polarity !== polarityFilter) return false;
      if (tagFilter !== "all" && !(a.tags || []).includes(tagFilter)) return false;
      if (q) {
        const hay = `${a.name} ${a.impact_on_goal} ${(a.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activities, selectedRealm, categoryFilter, polarityFilter, tagFilter, search]);

  return (
    <div className="space-y-6">
      {/* Recovery Protocol Banner when Baseline < 95 or Shield < 70 */}
      {profile?.inRecoveryMode && recoverySuggestions.length > 0 && (
        <section className="p-4 sm:p-5 rounded-2xl border border-warning/50 bg-warning/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="badge badge-warning badge-sm font-bold">
                RECEPTOR RECOVERY PROTOCOL ACTIVE
              </span>
              <h3 className="text-base font-extrabold text-base-content mt-1">
                Baseline is below 95 ({profile.currentBaseline}) — Execute a Reset Act Now
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recoverySuggestions.map((act) => (
              <button
                key={act._id}
                type="button"
                disabled={loggingId === act._id}
                onClick={() => onLogActivity(act._id, "standard", "Recovery reset")}
                className="p-3 rounded-xl border border-warning/40 bg-base-100 text-left hover:border-primary transition-all flex items-center justify-between gap-2"
              >
                <span className="text-xs font-bold text-base-content line-clamp-2">
                  {act.name}
                </span>
                <span className="badge badge-success badge-sm font-mono shrink-0">
                  +{act.baseXp} XP
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pinned Core Daily Anchors */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
              Core Daily Anchors & Guardrails
            </h2>
            <p className="text-xs text-base-content/65">
              Fast 1-tap scorecard for Fajr, 5 Salah, Guarded Tongue, Deep Study, and Urge Battles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-base-content/70">
              Logging Cycle:
            </label>
            <select
              value={backdateDays}
              onChange={(e) => onChangeBackdate(Number(e.target.value))}
              className="select select-bordered select-xs font-semibold"
            >
              <option value={0}>Current Maghrib Cycle</option>
              <option value={1}>Previous Cycle (-1 Day)</option>
              <option value={2}>2 Cycles Ago (-2 Days)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {pinnedActivities.map((act) => (
            <ActivityActionCard
              key={act._id}
              act={act}
              loggedCount={dailyActivityCounts[act.activityNumber] || 0}
              onLog={onLogActivity}
              onTogglePin={onTogglePin}
              loggingId={loggingId}
              compact
            />
          ))}
        </div>
      </section>

      {/* Main Layout: Full Catalog (8 cols) + Cycle Ledger (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 space-y-4">
          {/* Search + Filters */}
          <div className="p-4 rounded-2xl border border-base-300 bg-base-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search acts, tongue, DSA, Fajr..."
                className="input input-bordered input-sm w-full"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedRealm}
                onChange={(e) => onSelectRealm(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="all">All 4 Realms</option>
                <option value="imaan">Imaan & Akhirah</option>
                <option value="duniya">Duniya & CSE</option>
                <option value="willpower">Willpower Shield</option>
                <option value="akhlaq">Akhlaq & Tongue</option>
              </select>
              <select
                value={polarityFilter}
                onChange={(e) => setPolarityFilter(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="all">All Polarities</option>
                <option value="good">Good Acts (+XP)</option>
                <option value="neutral_positive">Neutral-Positive</option>
                <option value="harmful">Harmful Traps (-XP)</option>
              </select>
            </div>

            {/* Quick Tag Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTagFilter("all")}
                className={`badge badge-sm cursor-pointer ${
                  tagFilter === "all"
                    ? "badge-primary font-bold"
                    : "badge-ghost border-base-300"
                }`}
              >
                All Tags
              </button>
              {POPULAR_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === t ? "all" : t)}
                  className={`badge badge-sm cursor-pointer ${
                    tagFilter === t
                      ? "badge-primary font-bold"
                      : "badge-ghost border-base-300 hover:border-primary/40"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-base-content/65">
              Showing {filteredActivities.length} of {activities.length} life acts
            </span>
            {(search ||
              categoryFilter !== "all" ||
              selectedRealm !== "all" ||
              polarityFilter !== "all" ||
              tagFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  onSelectRealm("all");
                  setPolarityFilter("all");
                  setTagFilter("all");
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredActivities.map((act) => (
              <ActivityActionCard
                key={act._id}
                act={act}
                loggedCount={dailyActivityCounts[act.activityNumber] || 0}
                onLog={onLogActivity}
                onTogglePin={onTogglePin}
                loggingId={loggingId}
              />
            ))}
          </div>
        </div>

        {/* Cycle Ledger (4 cols) */}
        <aside className="xl:col-span-4 rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5 sticky top-20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold">Cycle Muhasabah Ledger</h2>
              <p className="text-[11px] font-mono text-base-content/60">
                Cycle Date: {activeDateKey}
              </p>
            </div>
            <span className="badge badge-ghost font-mono text-xs border-base-300">
              {todayLogs.length} entries
            </span>
          </div>

          {todayLogs.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-base-300 text-xs text-base-content/60">
              No acts logged in this Maghrib cycle yet. Start with your Core Anchors above!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {todayLogs.map((log) => {
                const isNeg = log.totalXpDelta < 0;
                return (
                  <div
                    key={log._id}
                    className={`p-3 rounded-xl border text-xs ${
                      isNeg
                        ? "border-error/30 bg-error/5"
                        : "border-base-300 bg-base-200/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-base-content leading-snug">
                        {log.title}
                      </div>
                      <span
                        className={`font-mono font-black shrink-0 ${
                          isNeg ? "text-error" : "text-emerald-500"
                        }`}
                      >
                        {log.totalXpDelta >= 0
                          ? `+${log.totalXpDelta}`
                          : log.totalXpDelta}{" "}
                        XP
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-base-content/60 font-mono">
                      <span>
                        {new Date(log.loggedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {log.intensityLabel && <span>• {log.intensityLabel}</span>}
                      {log.comboMultiplier > 1 && (
                        <span className="text-amber-500 font-bold">
                          • {log.comboMultiplier}x Combo
                        </span>
                      )}
                    </div>

                    {log.note && (
                      <p className="mt-1.5 text-[11px] italic text-base-content/75 bg-base-100 px-2 py-1 rounded border border-base-300/60">
                        “{log.note}”
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                        {Object.entries(log.realmDeltas || {})
                          .filter(([, v]) => v !== 0)
                          .map(([r, v]) => (
                            <span key={r} className="opacity-75">
                              {r}:{v > 0 ? `+${v}` : v}
                            </span>
                          ))}
                      </div>
                      <button
                        type="button"
                        disabled={deletingLogId === log._id}
                        onClick={() => onDeleteLog(log._id)}
                        className="text-[11px] font-semibold text-error hover:underline"
                      >
                        {deletingLogId === log._id ? "Undoing..." : "Undo"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
