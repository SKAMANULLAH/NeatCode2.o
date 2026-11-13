import { useEffect, useMemo, useState } from "react";

const RAID_MODES = [
  {
    key: "cse_study",
    title: "Deep CSE Study Raid",
    realmLabel: "Duniya + Willpower",
    hint: "OS, DBMS, CN, System Design, or Project Architecture",
    color: "text-sky-500",
    border: "border-sky-500/40",
  },
  {
    key: "dsa_grind",
    title: "DSA Grind Without Peeking",
    realmLabel: "Duniya + Grit",
    hint: "Struggle cleanly before checking editorials",
    color: "text-cyan-500",
    border: "border-cyan-500/40",
  },
  {
    key: "quran_ibadah",
    title: "Qur'an & Spiritual Focus",
    realmLabel: "Imaan + Calm",
    hint: "Quiet Tilawah, Hifz, Tafsir, or Dhikr",
    color: "text-emerald-500",
    border: "border-emerald-500/40",
  },
  {
    key: "tongue_silence",
    title: "Hifz al-Lisan Silence Block",
    realmLabel: "Akhlaq & Tongue + Willpower",
    hint: "Zero idle talk, zero bragging, measured purposeful speech only",
    color: "text-violet-500",
    border: "border-violet-500/40",
  },
];

const DURATION_PRESETS = [25, 50, 90, 120, 180];

export function UrgeBossModal({ bosses, activeBossKey, onClose, onDefeatBoss, submitting }) {
  const [selectedKey, setSelectedKey] = useState(
    activeBossKey || bosses?.[0]?.key || "scroll_illusion",
  );
  const selectedBoss = useMemo(
    () => (bosses || []).find((b) => b.key === selectedKey) || bosses?.[0],
    [bosses, selectedKey],
  );

  const [secondsLeft, setSecondsLeft] = useState(selectedBoss?.durationSeconds || 90);
  const [checkedSteps, setCheckedSteps] = useState([]);
  const [note, setNote] = useState("");

  const handleSelectBoss = (boss) => {
    setSelectedKey(boss.key);
    setSecondsLeft(boss.durationSeconds || 90);
    setCheckedSteps([]);
  };

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  if (!selectedBoss) return null;

  const totalSec = selectedBoss.durationSeconds || 90;
  const pctDone = Math.round(((totalSec - secondsLeft) / totalSec) * 100);
  const canClaimVictory = secondsLeft === 0;

  const toggleStep = (idx) => {
    setCheckedSteps((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx],
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-error/40 bg-base-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-r from-error/20 via-base-200 to-amber-500/15 px-6 py-4 border-b border-base-300 flex items-center justify-between">
          <div>
            <span className="badge badge-error badge-sm font-bold uppercase tracking-wider">
              EMERGENCY BOSS ARENA
            </span>
            <h2 className="text-xl font-black text-base-content mt-1">
              {selectedBoss.name}
            </h2>
            <p className="text-xs text-base-content/70">{selectedBoss.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close Boss Arena"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Switch Boss Selector */}
          <div className="flex flex-wrap gap-1.5">
            {(bosses || []).map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => handleSelectBoss(b)}
                className={`btn btn-xs rounded-full ${
                  selectedBoss.key === b.key
                    ? "btn-error"
                    : "btn-ghost border border-base-300"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Battle Countdown */}
          <div className="p-4 rounded-2xl border border-base-300 bg-base-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Hold The Line Until Timer Hits 00:00
              </div>
              <div className="text-4xl font-mono font-black text-error mt-1">
                {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </div>
              <p className="text-xs text-base-content/70 mt-1">
                Victory Reward:{" "}
                <strong className="text-emerald-500">
                  +{selectedBoss.rewardXp} XP
                </strong>{" "}
                &{" "}
                <strong className="text-info">
                  +{selectedBoss.shieldRepair} Shield HP
                </strong>
              </p>
            </div>

            <div className="w-full sm:w-48">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>Boss HP Remaining</span>
                <span>{100 - pctDone}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-base-300 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-error to-amber-500 transition-all duration-500"
                  style={{ width: `${100 - pctDone}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sunnah & Tactical Steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/65 mb-2">
              Tactical Counter-Moves (Tap as you execute)
            </h3>
            <div className="space-y-2">
              {selectedBoss.steps.map((step, idx) => {
                const checked = checkedSteps.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleStep(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      checked
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-base-300 bg-base-200/40 hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 ${
                        checked
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-base-content/30"
                      }`}
                    >
                      {checked ? "✓" : idx + 1}
                    </span>
                    <span className="text-sm text-base-content">{step}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70 block mb-1">
              Trigger / Reflection Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Felt tired after lecture, walked away and made Wudu..."
              className="input input-bordered input-sm w-full"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-base-300 bg-base-200/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canClaimVictory || submitting}
            onClick={() => onDefeatBoss(selectedBoss.key, note)}
            className={`btn btn-sm sm:btn-md font-bold ${
              canClaimVictory ? "btn-success animate-pulse" : "btn-disabled"
            }`}
          >
            {submitting
              ? "Recording Victory..."
              : canClaimVictory
                ? `BOSS DEFEATED — CLAIM +${selectedBoss.rewardXp} XP!`
                : `Survive ${secondsLeft}s More to Defeat Boss`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FocusRaidAndBossPanel({
  bosses,
  onCompleteRaid,
  onOpenBossModal,
  submitting,
}) {
  const [raidMode, setRaidMode] = useState("cse_study");
  const [durationMins, setDurationMins] = useState(50);
  const [secondsLeft, setSecondsLeft] = useState(50 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [raidNote, setRaidNote] = useState("");

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const handleSelectDuration = (mins) => {
    const safe = Math.max(5, Math.min(360, Number(mins) || 25));
    setIsRunning(false);
    setDurationMins(safe);
    setSecondsLeft(safe * 60);
  };

  const totalSec = durationMins * 60;
  const elapsedSec = Math.max(0, totalSec - secondsLeft);
  const elapsedMins = Math.floor(elapsedSec / 60);
  const progressPct = totalSec > 0 ? Math.round((elapsedSec / totalSec) * 100) : 0;
  const canFinishEarly = elapsedMins >= 5;
  const isCompleted = secondsLeft === 0;

  const activeMode = RAID_MODES.find((m) => m.key === raidMode) || RAID_MODES[0];

  const handleClaimRaid = async () => {
    const claimedMinutes = isCompleted ? durationMins : Math.max(5, elapsedMins);
    const ok = await onCompleteRaid(raidMode, claimedMinutes, raidNote);
    if (ok) {
      setIsRunning(false);
      setSecondsLeft(durationMins * 60);
      setRaidNote("");
    }
  };

  const displayMins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const displaySecs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Focus Raid Timer (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="badge badge-primary badge-sm font-bold">
              REAL-WORLD WORK ENGINE
            </span>
            <h2 className="text-xl font-extrabold mt-1">Focus Raid Timer</h2>
            <p className="text-xs text-base-content/65">
              Put your phone down and execute in the real world. Raids award a +15% focus bonus!
            </p>
          </div>
          <span className="text-xs font-mono badge badge-ghost border-base-300">
            {progressPct}% Completed
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {RAID_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              disabled={isRunning}
              onClick={() => setRaidMode(m.key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                raidMode === m.key
                  ? `${m.border} bg-base-200/70 ring-1 ring-primary/30`
                  : "border-base-300 bg-base-100 hover:bg-base-200/30"
              } ${isRunning ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              <div className={`text-xs font-bold ${m.color}`}>{m.realmLabel}</div>
              <div className="text-sm font-bold text-base-content mt-0.5">
                {m.title}
              </div>
              <div className="text-[11px] text-base-content/60 mt-0.5">{m.hint}</div>
            </button>
          ))}
        </div>

        {/* Presets & Clock */}
        <div className="p-5 rounded-2xl border border-base-300 bg-base-200/40 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <div className={`text-xs font-bold uppercase ${activeMode.color}`}>
              {activeMode.title}
            </div>
            <div className="text-5xl font-mono font-black tracking-tight text-base-content my-2">
              {displayMins}:{displaySecs}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isRunning}
                  onClick={() => handleSelectDuration(p)}
                  className={`btn btn-xs ${
                    durationMins === p
                      ? "btn-primary"
                      : "btn-ghost border border-base-300"
                  }`}
                >
                  {p >= 60 ? `${p / 60}h` : `${p}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-52">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              disabled={isCompleted}
              className={`btn btn-md font-bold ${
                isRunning ? "btn-warning" : "btn-primary"
              }`}
            >
              {isRunning ? "Pause Raid" : elapsedSec > 0 ? "Resume Raid" : "Start Raid"}
            </button>

            <button
              type="button"
              disabled={(!isCompleted && !canFinishEarly) || submitting}
              onClick={handleClaimRaid}
              className={`btn btn-sm font-bold ${
                isCompleted
                  ? "btn-success animate-pulse"
                  : canFinishEarly
                    ? "btn-outline btn-success"
                    : "btn-disabled"
              }`}
            >
              {submitting
                ? "Claiming..."
                : isCompleted
                  ? "Raid Finished — Claim XP!"
                  : canFinishEarly
                    ? `Log Partial (${elapsedMins}m)`
                    : "Run >= 5m to Log"}
            </button>

            <button
              type="button"
              onClick={() => handleSelectDuration(durationMins)}
              className="btn btn-xs btn-ghost"
            >
              Reset Clock
            </button>
          </div>
        </div>

        <input
          type="text"
          value={raidNote}
          onChange={(e) => setRaidNote(e.target.value)}
          placeholder="Optional note (e.g., Finished 3 DP graphs problems / 2h silent CSE notes)..."
          className="input input-bordered input-sm w-full"
        />
      </div>

      {/* Boss Selection Cards (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6 space-y-4">
        <div>
          <span className="badge badge-error badge-sm font-bold">
            CLUTCH DEFENSE
          </span>
          <h2 className="text-xl font-extrabold mt-1">Urge Boss Battles</h2>
          <p className="text-xs text-base-content/65">
            When temptation strikes—Reels, PMO, excessive talking, anger, or laziness—trigger a battle instead of relapsing.
          </p>
        </div>

        <div className="space-y-2.5">
          {(bosses || []).map((b) => (
            <div
              key={b.key}
              className="p-3.5 rounded-xl border border-base-300 bg-base-200/35 flex items-center justify-between gap-3 hover:border-error/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-base-content truncate">
                  {b.name}
                </div>
                <div className="text-[11px] text-base-content/65 truncate">
                  {b.subtitle}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                  <span className="text-error font-bold">{b.durationSeconds}s Fight</span>
                  <span className="text-emerald-500 font-bold">+{b.rewardXp} XP</span>
                  <span className="text-info font-bold">+{b.shieldRepair} Shield</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenBossModal(b.key)}
                className="btn btn-xs sm:btn-sm btn-error font-bold shrink-0"
              >
                Battle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
