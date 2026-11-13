import { REALM_STYLES } from "../../utils/disciplineHelpers";

const REALM_ORDER = ["imaan", "duniya", "willpower", "akhlaq"];

export default function RealmTowersGrid({
  realms,
  selectedRealm,
  onSelectRealm,
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {REALM_ORDER.map((key) => {
        const realm = realms?.[key];
        if (!realm) return null;
        const style = REALM_STYLES[key];
        const isSelected = selectedRealm === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectRealm(isSelected ? "all" : key)}
            className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 bg-base-100 ${
              isSelected
                ? `${style.border} ring-2 ${style.ring} shadow-md`
                : "border-base-300 hover:border-base-content/25 shadow-2xs"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${style.text}`}
                >
                  {realm.label}
                </span>
                <div className="text-base font-extrabold text-base-content mt-0.5 leading-snug">
                  {realm.rank?.title}
                </div>
              </div>

              <div
                className={`px-2.5 py-1 rounded-xl ${style.bgSoft} ${style.text} font-black text-sm shrink-0`}
              >
                Lv {realm.level}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-base-content/65 mb-1">
                <span>
                  {realm.xpIntoLevel}/{realm.xpNeededForNext} XP
                </span>
                <span
                  className={`font-bold ${
                    realm.todayXp > 0
                      ? style.text
                      : realm.todayXp < 0
                        ? "text-error"
                        : "text-base-content/50"
                  }`}
                >
                  {realm.todayXp >= 0 ? `+${realm.todayXp}` : realm.todayXp} today
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-base-300 overflow-hidden">
                <div
                  className={`h-full ${style.bar} transition-all duration-500`}
                  style={{ width: `${realm.progressPct || 0}%` }}
                />
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-base-content/60">
              <span>
                {realm.rank?.nextTitle
                  ? `Next: ${realm.rank.nextTitle} (Lv ${realm.rank.nextRankMinLevel})`
                  : "Max Rank Reached"}
              </span>
              <span className="font-semibold text-primary">
                {isSelected ? "Filtered ✓" : "Filter"}
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
