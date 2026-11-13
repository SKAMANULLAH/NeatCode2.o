export const CATEGORY_META = {
  ibadah_and_spiritual_discipline: {
    label: "Ibadah & Spiritual",
    short: "Ibadah",
    badgeClass: "badge-primary",
  },
  akhlaq_and_guarding_tongue: {
    label: "Akhlaq & Tongue Control",
    short: "Tongue & Akhlaq",
    badgeClass: "badge-secondary",
  },
  dawat_wa_tabligh_and_social: {
    label: "Dawat & Brotherhood",
    short: "Dawat & Social",
    badgeClass: "badge-accent",
  },
  cse_academics_and_halal_income: {
    label: "CSE & Halal Income",
    short: "CSE & Halal",
    badgeClass: "badge-info",
  },
  digital_habits_and_desire: {
    label: "Digital & Desire",
    short: "Digital Shield",
    badgeClass: "badge-warning",
  },
  body_food_stimulants_and_routine: {
    label: "Body & Routine",
    short: "Body & Sleep",
    badgeClass: "badge-success",
  },
  custom: {
    label: "Custom Acts",
    short: "Custom",
    badgeClass: "badge-ghost",
  },
};

export const REALM_STYLES = {
  imaan: {
    text: "text-emerald-500",
    bgSoft: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    bar: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    label: "Imaan & Akhirah",
  },
  duniya: {
    text: "text-sky-500",
    bgSoft: "bg-sky-500/10",
    border: "border-sky-500/30",
    bar: "bg-sky-500",
    ring: "ring-sky-500/30",
    label: "Duniya & CSE",
  },
  willpower: {
    text: "text-amber-500",
    bgSoft: "bg-amber-500/10",
    border: "border-amber-500/30",
    bar: "bg-amber-500",
    ring: "ring-amber-500/30",
    label: "Willpower Shield",
  },
  akhlaq: {
    text: "text-violet-500",
    bgSoft: "bg-violet-500/10",
    border: "border-violet-500/30",
    bar: "bg-violet-500",
    ring: "ring-violet-500/30",
    label: "Akhlaq & Tongue",
  },
};

export const ACTION_TIER_META = {
  core_goal_and_anchor: {
    label: "Core Anchor",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  keep_and_protect: {
    label: "Keep & Protect",
    className: "bg-success/15 text-success border-success/30",
  },
  guard_against_trap: {
    label: "Guard Trap",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  eliminate_completely: {
    label: "Eliminate",
    className: "bg-error/15 text-error border-error/30",
  },
};

export const MASTER_BADGE_COLORS = {
  Bronze: "from-amber-700 to-amber-900 text-amber-100 border-amber-500/40",
  Silver: "from-slate-400 to-slate-600 text-white border-slate-300/40",
  Gold: "from-yellow-400 to-amber-600 text-amber-950 border-yellow-300/60",
  Platinum: "from-cyan-400 to-teal-600 text-white border-cyan-300/60",
  Diamond: "from-sky-400 to-indigo-600 text-white border-sky-300/60",
  Heroic: "from-rose-500 to-red-700 text-white border-rose-300/60",
  Grandmaster: "from-purple-500 to-fuchsia-700 text-white border-purple-300/60",
  Legend: "from-emerald-400 via-teal-500 to-amber-400 text-slate-950 border-emerald-200/80",
};

export function formatCountdownMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

export function getBaselineStatus(baseline) {
  if (baseline >= 112) {
    return {
      label: "Tonic Peak — Crisp Receptor Sensitivity",
      color: "text-emerald-500",
      barColor: "bg-emerald-500",
    };
  }
  if (baseline >= 100) {
    return {
      label: "Balanced Baseline — Healthy Drive",
      color: "text-primary",
      barColor: "bg-primary",
    };
  }
  if (baseline >= 88) {
    return {
      label: "Slightly Fatigued — Guard Traps",
      color: "text-warning",
      barColor: "bg-warning",
    };
  }
  return {
    label: "Crash / Recovery Needed — Run Reset Protocol",
    color: "text-error",
    barColor: "bg-error",
  };
}
