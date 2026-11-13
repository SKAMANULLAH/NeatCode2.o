import { useState } from "react";
import { CATEGORY_META } from "../../utils/disciplineHelpers";

export default function TrophiesAndSettingsPanel({
  dashboard,
  onCreateActivity,
  onUpdateSettings,
  savingSettings,
  creatingAct,
}) {
  const { achievements = [], profile, metadata } = dashboard;
  const settings = profile?.settings || {};

  // Maghrib & Preferences state
  const [maghribHour, setMaghribHour] = useState(settings.maghribHour ?? 19);
  const [maghribMinute, setMaghribMinute] = useState(settings.maghribMinute ?? 0);
  const [tzOffset, setTzOffset] = useState(settings.timezoneOffsetMinutes ?? 330);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [autoSyncDsa, setAutoSyncDsa] = useState(settings.autoSyncDsa ?? true);

  // Custom Act Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("custom");
  const [polarity, setPolarity] = useState("good");
  const [primaryRealm, setPrimaryRealm] = useState("imaan");
  const [baseXp, setBaseXp] = useState(35);
  const [dailyCap, setDailyCap] = useState(1);
  const [tagsInput, setTagsInput] = useState("custom");
  const [impactNote, setImpactNote] = useState("");
  const [isPinned, setIsPinned] = useState(true);
  const [supportsIntensity, setSupportsIntensity] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings({
      maghribHour: Number(maghribHour),
      maghribMinute: Number(maghribMinute),
      timezoneOffsetMinutes: Number(tzOffset),
      soundEnabled,
      autoSyncDsa,
    });
  };

  const handleDetectBrowserTz = () => {
    const offset = -new Date().getTimezoneOffset();
    setTzOffset(offset);
  };

  const handleCreateCustomAct = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await onCreateActivity({
      name: name.trim(),
      category,
      polarity,
      primaryRealm,
      baseXp: Number(baseXp),
      dailyCap: Number(dailyCap),
      tags: tagsInput,
      impact_on_goal: impactNote.trim(),
      isPinned,
      supportsIntensity,
      action_tier:
        polarity === "harmful" ? "guard_against_trap" : "keep_and_protect",
    });
    if (ok) {
      setName("");
      setImpactNote("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Trophy Cabinet */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Trophy Cabinet ({unlockedCount}/{achievements.length} Unlocked)
            </h2>
            <p className="text-xs text-base-content/65">
              Earned through real streaks, Urge Boss victories, Guarded Tongue mastery, and balanced realms.
            </p>
          </div>
          <div className="text-xs font-mono text-base-content/70">
            Raids: <strong>{profile?.raidsCompleted || 0}</strong> • Bosses:{" "}
            <strong>{profile?.bossesDefeated || 0}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.key}
              className={`p-3.5 rounded-xl border transition-all ${
                ach.unlocked
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-base-300 bg-base-200/35 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-base-content">
                  {ach.unlocked ? "🏆 " : "🔒 "}
                  {ach.title}
                </span>
                {ach.unlocked && (
                  <span className="badge badge-warning badge-xs font-bold">
                    Unlocked
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/70 mt-1">
                {ach.description}
              </p>
              {ach.unlockedAt && (
                <p className="text-[10px] font-mono text-base-content/55 mt-1.5">
                  Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Split: Custom Act Creator + Maghrib Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Create Custom Act (7 cols) */}
        <form
          onSubmit={handleCreateCustomAct}
          className="lg:col-span-7 rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6 space-y-4"
        >
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Add Custom Life Act & Tags
            </h2>
            <p className="text-xs text-base-content/65">
              Expand your system anytime as new university, Dawah, or personal habits emerge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold block mb-1">
                Act Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Reading 10 pages of Seerah silently before sleep"
                className="input input-bordered input-sm w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Polarity</label>
              <select
                value={polarity}
                onChange={(e) => setPolarity(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="good">Good (+XP)</option>
                <option value="neutral_positive">Neutral Positive (+XP)</option>
                <option value="harmful">Harmful Trap (-XP)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Primary Realm
              </label>
              <select
                value={primaryRealm}
                onChange={(e) => setPrimaryRealm(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="imaan">Imaan & Akhirah</option>
                <option value="duniya">Duniya & CSE</option>
                <option value="willpower">Willpower Shield</option>
                <option value="akhlaq">Akhlaq & Tongue</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Base XP (magnitude)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={baseXp}
                onChange={(e) => setBaseXp(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Daily Cap (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tongue-control, study-marathon, dawah"
                className="input input-bordered input-sm w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold block mb-1">
                Impact on Goal
              </label>
              <input
                type="text"
                value={impactNote}
                onChange={(e) => setImpactNote(e.target.value)}
                placeholder="Why this act matters for your Deen or Duniya..."
                className="input input-bordered input-sm w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="checkbox checkbox-primary checkbox-xs"
              />
              <span>Pin to Core Daily Scorecard</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={supportsIntensity}
                onChange={(e) => setSupportsIntensity(e.target.checked)}
                className="checkbox checkbox-primary checkbox-xs"
              />
              <span>Support 1x / 1.5x / 2x Intensity</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={creatingAct}
            className="btn btn-primary btn-sm font-bold"
          >
            {creatingAct ? "Adding Act..." : "Add Custom Act"}
          </button>
        </form>

        {/* Maghrib Settings + Scale Disclaimer (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSaveSettings}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Maghrib Day Cutoff & Preferences
              </h2>
              <p className="text-xs text-base-content/65">
                Your day begins at Maghrib and resets at the next Maghrib. Adjust seasonal prayer shift anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Maghrib Hour (24h: 15-22)
                </label>
                <input
                  type="number"
                  min="15"
                  max="22"
                  value={maghribHour}
                  onChange={(e) => setMaghribHour(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Maghrib Minute
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={maghribMinute}
                  onChange={(e) => setMaghribMinute(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">
                  Timezone Offset (minutes from UTC)
                </label>
                <button
                  type="button"
                  onClick={handleDetectBrowserTz}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Use Browser TZ
                </button>
              </div>
              <input
                type="number"
                value={tzOffset}
                onChange={(e) => setTzOffset(e.target.value)}
                className="input input-bordered input-sm w-full font-mono"
              />
              <p className="text-[10px] text-base-content/55 mt-1">
                India IST (+05:30) = 330
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="checkbox checkbox-primary checkbox-xs"
              />
              <span>Enable Web Audio game SFX (chimes, chest pop, level up)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={autoSyncDsa}
                onChange={(e) => setAutoSyncDsa(e.target.checked)}
                className="checkbox checkbox-primary checkbox-xs"
              />
              <span>Auto-award Duniya DSA XP on Accepted NeatCode submissions</span>
            </label>

            <button
              type="submit"
              disabled={savingSettings}
              className="btn btn-primary btn-sm w-full font-bold"
            >
              {savingSettings ? "Saving..." : "Save Maghrib & Game Settings"}
            </button>
          </form>

          {/* Scale Disclaimer */}
          <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4 text-xs text-base-content/70 leading-relaxed">
            <div className="font-bold text-base-content mb-1">
              {metadata?.scale?.name} (Baseline: {metadata?.scale?.resting_baseline})
            </div>
            <p>{metadata?.scale?.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
