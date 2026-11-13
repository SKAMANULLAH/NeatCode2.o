const {
  REALM_CONFIG,
  MASTER_RANKS,
  ACHIEVEMENTS,
  SEED_ACTIVITIES,
} = require("../constants/disciplineCatalog.js");
const disciplineActivityModel = require("../models/disciplineActivityModel.js");
const disciplineLogModel = require("../models/disciplineLogModel.js");
const disciplineProfileModel = require("../models/disciplineProfileModel.js");
const disciplineDailySummaryModel = require("../models/disciplineDailySummaryModel.js");

const REALM_KEYS = ["imaan", "duniya", "willpower", "akhlaq"];

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatYmdFromUtcDate(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function parseYmdToUtcMidnight(dateKey) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function addDaysToDateKey(dateKey, deltaDays) {
  const dt = parseYmdToUtcMidnight(dateKey);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return formatYmdFromUtcDate(dt);
}

/**
 * Computes the Maghrib-to-Maghrib cycle boundaries and dateKey.
 * A cycle starting at 19:00 on YYYY-MM-DD through 18:59 on the next day uses dateKey = YYYY-MM-DD.
 */
function getMaghribCycleInfo(now = new Date(), settings = {}) {
  const maghribHour = Number.isFinite(Number(settings.maghribHour))
    ? clamp(Number(settings.maghribHour), 15, 22)
    : 19;
  const maghribMinute = Number.isFinite(Number(settings.maghribMinute))
    ? clamp(Number(settings.maghribMinute), 0, 59)
    : 0;
  const timezoneOffsetMinutes = Number.isFinite(
    Number(settings.timezoneOffsetMinutes),
  )
    ? clamp(Number(settings.timezoneOffsetMinutes), -720, 840)
    : 330;

  const offsetMs = timezoneOffsetMinutes * 60 * 1000;
  const localMs = now.getTime() + offsetMs;
  const localNow = new Date(localMs);

  const localMinutesOfDay =
    localNow.getUTCHours() * 60 + localNow.getUTCMinutes();
  const cutoffMinutes = maghribHour * 60 + maghribMinute;

  const baseMidnightMs = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
    0,
    0,
    0,
    0,
  );

  const cycleStartLocalMs =
    localMinutesOfDay >= cutoffMinutes
      ? baseMidnightMs + cutoffMinutes * 60 * 1000
      : baseMidnightMs - 24 * 60 * 60 * 1000 + cutoffMinutes * 60 * 1000;

  const cycleEndLocalMs = cycleStartLocalMs + 24 * 60 * 60 * 1000;
  const dateKey = formatYmdFromUtcDate(new Date(cycleStartLocalMs));
  const msUntilReset = Math.max(0, cycleEndLocalMs - localMs);

  const startLocalDate = new Date(cycleStartLocalMs);
  const endLocalDate = new Date(cycleEndLocalMs);

  return {
    dateKey,
    maghribHour,
    maghribMinute,
    timezoneOffsetMinutes,
    cycleStartIso: new Date(cycleStartLocalMs - offsetMs).toISOString(),
    cycleEndIso: new Date(cycleEndLocalMs - offsetMs).toISOString(),
    cycleWindowLabel: `${formatShortMonthDay(startLocalDate)} ${formatTime12h(maghribHour, maghribMinute)} - ${formatShortMonthDay(endLocalDate)} ${formatTime12h(maghribHour, maghribMinute)}`,
    msUntilReset,
  };
}

function formatShortMonthDay(utcDate) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[utcDate.getUTCMonth()]} ${utcDate.getUTCDate()}`;
}

function formatTime12h(hour24, minute) {
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h12}:${pad2(minute)} ${suffix}`;
}

function xpStepForRealmLevel(level) {
  return Math.round(65 + 32 * (level - 1) + 8 * Math.pow(level - 1, 1.35));
}

function xpStepForOverallLevel(level) {
  return Math.round(90 + 45 * (level - 1) + 12 * Math.pow(level - 1, 1.35));
}

function getLevelProgress(totalXp, stepFn = xpStepForRealmLevel) {
  const safeXp = Math.max(0, Math.round(totalXp || 0));
  let level = 1;
  let remaining = safeXp;
  let step = stepFn(level);

  while (remaining >= step && level < 100) {
    remaining -= step;
    level += 1;
    step = stepFn(level);
  }

  const progressPct =
    level >= 100 ? 100 : Math.min(100, Math.round((remaining / step) * 100));

  return {
    level,
    xp: safeXp,
    xpIntoLevel: remaining,
    xpNeededForNext: step,
    progressPct,
  };
}

function getRealmRankInfo(realmKey, level) {
  const config = REALM_CONFIG[realmKey];
  const ranks = config?.ranks || [];
  let current = ranks[0] || { minLevel: 1, title: "Initiate" };
  let next = null;

  for (let i = 0; i < ranks.length; i += 1) {
    if (level >= ranks[i].minLevel) {
      current = ranks[i];
      next = ranks[i + 1] || null;
    }
  }

  return {
    title: current.title,
    nextTitle: next ? next.title : null,
    nextRankMinLevel: next ? next.minLevel : null,
  };
}

function getMasterRankStatus(realmLevels) {
  const vals = REALM_KEYS.map((k) => realmLevels[k] || 1);
  const avgLevel = Number(
    (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
  );
  const floorLevel = Math.min(...vals);

  let current = MASTER_RANKS[0];
  let next = MASTER_RANKS[1] || null;

  for (let i = 0; i < MASTER_RANKS.length; i += 1) {
    const rank = MASTER_RANKS[i];
    if (avgLevel >= rank.minAvgLevel && floorLevel >= rank.minFloorLevel) {
      current = rank;
      next = MASTER_RANKS[i + 1] || null;
    } else {
      break;
    }
  }

  const blockers = [];
  if (next) {
    if (avgLevel < next.minAvgLevel) {
      blockers.push(
        `Raise average realm level from ${avgLevel} to ${next.minAvgLevel}`,
      );
    }
    REALM_KEYS.forEach((key) => {
      if ((realmLevels[key] || 1) < next.minFloorLevel) {
        blockers.push(
          `Raise ${REALM_CONFIG[key].shortLabel} from Lv ${realmLevels[key] || 1} to Lv ${next.minFloorLevel}`,
        );
      }
    });
  }

  return {
    current,
    next,
    avgLevel,
    floorLevel,
    blockers,
  };
}

function computeComboMultiplier(goodStreakToday) {
  if (goodStreakToday >= 10) return 1.6;
  if (goodStreakToday >= 7) return 1.45;
  if (goodStreakToday >= 4) return 1.3;
  if (goodStreakToday >= 2) return 1.15;
  return 1.0;
}

function computeStreakMultiplier(anchorStreak, cleanStreak) {
  const bestActive = Math.max(anchorStreak || 0, cleanStreak || 0);
  if (bestActive >= 30) return 1.4;
  if (bestActive >= 14) return 1.3;
  if (bestActive >= 7) return 1.2;
  if (bestActive >= 3) return 1.1;
  return 1.0;
}

function distributeRealmXp(totalXp, realmWeights, fallbackRealm = "imaan") {
  const deltas = { imaan: 0, duniya: 0, willpower: 0, akhlaq: 0 };
  if (!totalXp) return deltas;

  const entries = REALM_KEYS.map((k) => [
    k,
    Math.max(0, Number(realmWeights?.[k] || 0)),
  ]).filter(([, w]) => w > 0);

  if (entries.length === 0) {
    deltas[fallbackRealm] = totalXp;
    return deltas;
  }

  const weightSum = entries.reduce((sum, [, w]) => sum + w, 0);
  let allocated = 0;

  entries.forEach(([key, weight], idx) => {
    if (idx === entries.length - 1) {
      deltas[key] = totalXp - allocated;
    } else {
      const share = Math.round((totalXp * weight) / weightSum);
      deltas[key] = share;
      allocated += share;
    }
  });

  return deltas;
}

function evaluateDailyQuests(summary) {
  const s = summary || {};
  const imaanAnchors = s.imaanAnchorCount || 0;
  const tongueCtrl = s.tongueControlCount || 0;
  const tongueLeak = s.tongueLeakCount || 0;
  const duniyaCount = s.duniyaStudyCount || 0;
  const goodCount = s.goodCount || 0;
  const severeTraps = s.severeTrapCount || 0;

  const quests = [
    {
      key: "quest_imaan_anchor",
      title: "Salah & Heart Anchor",
      description: "Log 2+ core Imaan & Ibadah acts this Maghrib cycle",
      realm: "imaan",
      current: Math.min(2, imaanAnchors),
      target: 2,
      completed: imaanAnchors >= 2,
      failed: false,
    },
    {
      key: "quest_tongue_guard",
      title: "Hifz al-Lisan (Guarded Tongue)",
      description:
        "Log 1+ Guarded Tongue / Silence act with 0 tongue leaks",
      realm: "akhlaq",
      current: tongueLeak > 0 ? 0 : Math.min(1, tongueCtrl),
      target: 1,
      completed: tongueCtrl >= 1 && tongueLeak === 0,
      failed: tongueLeak > 0,
    },
    {
      key: "quest_duniya_grind",
      title: "Duniya Deep Effort",
      description:
        "Log 1+ CSE Study, DSA, Project, or Focus Raid this cycle",
      realm: "duniya",
      current: Math.min(1, duniyaCount),
      target: 1,
      completed: duniyaCount >= 1,
      failed: false,
    },
    {
      key: "quest_clean_shield",
      title: "Pure Guardrail Shield",
      description:
        "Log 3+ positive acts with zero severe (eliminate-tier) traps",
      realm: "willpower",
      current: severeTraps > 0 ? 0 : Math.min(3, goodCount),
      target: 3,
      completed: goodCount >= 3 && severeTraps === 0,
      failed: severeTraps > 0,
    },
  ];

  const completedCount = quests.filter((q) => q.completed).length;
  const completionPct = Math.round((completedCount / quests.length) * 100);

  return {
    quests,
    completedCount,
    completionPct,
  };
}

/**
 * Ensures the admin user has a DisciplineProfile and the full seeded activity catalog.
 * Uses bulkWrite upsert by (adminId, activityNumber) so catalog expansions sync safely
 * without touching any custom activities or existing user customizations on custom fields.
 */
async function ensureAdminDisciplineInitialized(adminId) {
  let profile = await disciplineProfileModel.findOne({ adminId });
  if (!profile) {
    profile = await disciplineProfileModel.create({ adminId });
  }

  const existingCount = await disciplineActivityModel.countDocuments({
    adminId,
    isCustom: false,
  });

  if (existingCount < SEED_ACTIVITIES.length) {
    const existingNums = new Set(
      (
        await disciplineActivityModel
          .find({ adminId, isCustom: false }, "activityNumber")
          .lean()
      ).map((doc) => doc.activityNumber),
    );

    const missing = SEED_ACTIVITIES.filter(
      (act) => !existingNums.has(act.activityNumber),
    ).map((act) => ({
      ...act,
      adminId,
    }));

    if (missing.length > 0) {
      await disciplineActivityModel.insertMany(missing, { ordered: false });
    }
  }

  return profile;
}

function isQualifiedAnchorDay(s) {
  return (
    (s.imaanAnchorCount || 0) >= 1 &&
    (s.goodCount || 0) >= 2 &&
    (s.severeTrapCount || 0) === 0
  );
}

function isQualifiedCleanDay(s) {
  return (s.goodCount || 0) >= 1 && (s.severeTrapCount || 0) === 0;
}

function isQualifiedTongueDay(s) {
  return (s.tongueControlCount || 0) >= 1 && (s.tongueLeakCount || 0) === 0;
}

function computeStreakStats(summaryMap, currentDateKey, predicate) {
  const keys = Array.from(summaryMap.keys()).sort();
  let best = 0;
  let running = 0;
  let prevKey = null;

  for (const key of keys) {
    const summary = summaryMap.get(key);
    if (predicate(summary)) {
      if (prevKey && addDaysToDateKey(prevKey, 1) === key) {
        running += 1;
      } else {
        running = 1;
      }
      if (running > best) best = running;
      prevKey = key;
    } else {
      running = 0;
      prevKey = null;
    }
  }

  // Current active streak counts backwards from currentDateKey if qualified today,
  // or from yesterday if today's cycle is still in progress.
  let current = 0;
  let cursor = currentDateKey;
  if (summaryMap.has(currentDateKey) && predicate(summaryMap.get(currentDateKey))) {
    current = 1;
    cursor = addDaysToDateKey(currentDateKey, -1);
  } else {
    cursor = addDaysToDateKey(currentDateKey, -1);
  }

  while (summaryMap.has(cursor) && predicate(summaryMap.get(cursor))) {
    current += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return { current, best };
}

/**
 * Deterministically rebuilds all daily summaries, total/realm XP, levels, baseline,
 * shield HP, streaks, and achievement unlocks from DisciplineLog history.
 */
async function recomputeAdminDisciplineState(adminId) {
  const profile = await ensureAdminDisciplineInitialized(adminId);
  const cycleInfo = getMaghribCycleInfo(new Date(), profile.settings);
  const currentDateKey = cycleInfo.dateKey;

  const logs = await disciplineLogModel
    .find({ adminId })
    .sort({ dateKey: 1, loggedAt: 1, _id: 1 })
    .lean();

  // Preserve claimed chests per dateKey from existing summaries
  const existingSummaries = await disciplineDailySummaryModel
    .find({ adminId })
    .lean();
  const chestMap = new Map();
  const syncedProblemsMap = new Map();
  existingSummaries.forEach((s) => {
    if (s.claimedChests?.length) chestMap.set(s.dateKey, s.claimedChests);
    if (s.syncedProblemIds?.length)
      syncedProblemsMap.set(s.dateKey, s.syncedProblemIds);
  });

  const dayMap = new Map();
  const activityCounts = {};

  let totalXp = 0;
  const realmXp = { imaan: 0, duniya: 0, willpower: 0, akhlaq: 0 };
  let baseline = 100;
  let shieldHp = 100;
  let prevDayKey = null;
  let raidsCompleted = 0;
  let bossesDefeated = 0;

  for (const log of logs) {
    if (log.activityNumber) {
      activityCounts[log.activityNumber] =
        (activityCounts[log.activityNumber] || 0) + 1;
    }
    if (log.entryType === "raid") raidsCompleted += 1;
    if (log.entryType === "boss") bossesDefeated += 1;

    // Between days, baseline recovers 50% back toward resting 100 and shield regens slightly
    if (prevDayKey && prevDayKey !== log.dateKey) {
      baseline = Math.round(100 + (baseline - 100) * 0.55);
      shieldHp = Math.round(clamp(shieldHp + 8, 0, 150));
    }
    prevDayKey = log.dateKey;

    if (!dayMap.has(log.dateKey)) {
      dayMap.set(log.dateKey, {
        adminId,
        dateKey: log.dateKey,
        netXp: 0,
        positiveXp: 0,
        negativeXp: 0,
        realmXp: { imaan: 0, duniya: 0, willpower: 0, akhlaq: 0 },
        goodCount: 0,
        harmfulCount: 0,
        severeTrapCount: 0,
        imaanAnchorCount: 0,
        duniyaStudyCount: 0,
        tongueControlCount: 0,
        tongueLeakCount: 0,
        raidsCount: 0,
        bossesCount: 0,
        pillarsSet: new Set(),
        closingBaseline: 100,
        closingShieldHp: 100,
        balancedBonusAwarded: false,
        claimedChests: chestMap.get(log.dateKey) || [],
        syncedProblemIds: syncedProblemsMap.get(log.dateKey) || [],
      });
    }

    const day = dayMap.get(log.dateKey);

    const xpDelta = log.totalXpDelta || 0;
    totalXp = Math.max(0, totalXp + xpDelta);
    day.netXp += xpDelta;
    if (xpDelta >= 0) day.positiveXp += xpDelta;
    else day.negativeXp += Math.abs(xpDelta);

    const isActionLog = log.entryType !== "chest";

    REALM_KEYS.forEach((k) => {
      const rDelta = log.realmDeltas?.[k] || 0;
      realmXp[k] = Math.max(0, realmXp[k] + rDelta);
      day.realmXp[k] = day.realmXp[k] + rDelta;
      if (isActionLog && log.polarity !== "harmful" && rDelta > 0) {
        day.pillarsSet.add(k);
      }
    });

    if (isActionLog) {
      if (log.polarity === "harmful") {
        day.harmfulCount += 1;
        if (log.actionTier === "eliminate_completely") {
          day.severeTrapCount += 1;
        }
      } else {
        day.goodCount += 1;
      }

      const tags = log.tags || [];
      if (
        log.polarity !== "harmful" &&
        (log.category === "ibadah_and_spiritual_discipline" ||
          tags.includes("salah") ||
          tags.includes("quran") ||
          tags.includes("dhikr") ||
          tags.includes("dawah"))
      ) {
        day.imaanAnchorCount += 1;
      }

      if (
        log.polarity !== "harmful" &&
        (log.entryType === "raid" ||
          tags.includes("deep-study") ||
          tags.includes("study-marathon") ||
          tags.includes("dsa") ||
          tags.includes("coding") ||
          tags.includes("cs-core") ||
          tags.includes("halal-hustle"))
      ) {
        day.duniyaStudyCount += 1;
      }

      if (tags.includes("tongue-control")) day.tongueControlCount += 1;
      if (tags.includes("tongue-leak")) day.tongueLeakCount += 1;
      if (log.entryType === "raid") day.raidsCount += 1;
      if (log.entryType === "boss") day.bossesCount += 1;
    }

    baseline = clamp(baseline + (log.baselineDelta || 0), 55, 140);
    shieldHp = clamp(
      shieldHp + (log.shieldDelta ?? Math.round((log.baselineDelta || 0) * 1.6)),
      0,
      150,
    );

    day.closingBaseline = baseline;
    day.closingShieldHp = shieldHp;
  }

  // Apply 4-Pillar Balanced Day Bonus (+50 XP) cleanly per qualifying day
  let balancedDaysCount = 0;
  const summaryDocs = [];
  for (const [, day] of dayMap) {
    const pillarsHit = Array.from(day.pillarsSet);
    if (pillarsHit.length === 4) {
      day.balancedBonusAwarded = true;
      balancedDaysCount += 1;
      totalXp += 50;
      day.netXp += 50;
      day.positiveXp += 50;
      realmXp.imaan += 13;
      realmXp.duniya += 13;
      realmXp.willpower += 12;
      realmXp.akhlaq += 12;
      day.realmXp.imaan += 13;
      day.realmXp.duniya += 13;
      day.realmXp.willpower += 12;
      day.realmXp.akhlaq += 12;
    }
    const { pillarsSet, ...cleanDay } = day;
    summaryDocs.push({ ...cleanDay, pillarsHit });
  }

  // Replace daily summaries atomically for this admin
  await disciplineDailySummaryModel.deleteMany({ adminId });
  if (summaryDocs.length > 0) {
    await disciplineDailySummaryModel.insertMany(summaryDocs);
  }

  const summaryMap = new Map(summaryDocs.map((s) => [s.dateKey, s]));
  const anchorStats = computeStreakStats(
    summaryMap,
    currentDateKey,
    isQualifiedAnchorDay,
  );
  const cleanStats = computeStreakStats(
    summaryMap,
    currentDateKey,
    isQualifiedCleanDay,
  );
  const tongueStats = computeStreakStats(
    summaryMap,
    currentDateKey,
    isQualifiedTongueDay,
  );

  // If the last logged day was before today, decay baseline gently toward 100
  let liveBaseline = baseline;
  let liveShieldHp = shieldHp;
  if (prevDayKey && prevDayKey < currentDateKey) {
    liveBaseline = Math.round(100 + (baseline - 100) * 0.55);
    liveShieldHp = Math.round(clamp(shieldHp + 8, 0, 150));
  }

  profile.totalXp = totalXp;
  profile.realmXp = realmXp;
  profile.currentBaseline = liveBaseline;
  profile.shieldHp = liveShieldHp;
  profile.inRecoveryMode = liveBaseline < 95 || liveShieldHp < 70;
  profile.anchorStreak = anchorStats.current;
  profile.bestAnchorStreak = anchorStats.best;
  profile.cleanStreak = cleanStats.current;
  profile.bestCleanStreak = cleanStats.best;
  profile.tongueStreak = tongueStats.current;
  profile.bestTongueStreak = tongueStats.best;
  profile.raidsCompleted = raidsCompleted;
  profile.bossesDefeated = bossesDefeated;

  const realmLevels = {
    imaan: getLevelProgress(realmXp.imaan, xpStepForRealmLevel).level,
    duniya: getLevelProgress(realmXp.duniya, xpStepForRealmLevel).level,
    willpower: getLevelProgress(realmXp.willpower, xpStepForRealmLevel).level,
    akhlaq: getLevelProgress(realmXp.akhlaq, xpStepForRealmLevel).level,
  };
  const masterRankStatus = getMasterRankStatus(realmLevels);

  const existingAchievementKeys = new Set(
    (profile.unlockedAchievements || []).map((a) => a.key),
  );
  const newlyUnlocked = [];
  const evalContext = {
    totalLogs: logs.length,
    profile,
    levels: realmLevels,
    masterRank: masterRankStatus.current,
    activityCounts,
    balancedDaysCount,
  };

  for (const ach of ACHIEVEMENTS) {
    if (!existingAchievementKeys.has(ach.key) && ach.check(evalContext)) {
      const unlockedEntry = { key: ach.key, unlockedAt: new Date() };
      profile.unlockedAchievements.push(unlockedEntry);
      newlyUnlocked.push(ach);
    }
  }

  await profile.save();

  return {
    profile,
    cycleInfo,
    summaryMap,
    newlyUnlocked,
  };
}

module.exports = {
  REALM_KEYS,
  clamp,
  addDaysToDateKey,
  getMaghribCycleInfo,
  xpStepForRealmLevel,
  xpStepForOverallLevel,
  getLevelProgress,
  getRealmRankInfo,
  getMasterRankStatus,
  computeComboMultiplier,
  computeStreakMultiplier,
  distributeRealmXp,
  evaluateDailyQuests,
  ensureAdminDisciplineInitialized,
  recomputeAdminDisciplineState,
};
