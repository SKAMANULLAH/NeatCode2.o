const {
  DISCIPLINE_METADATA,
  REALM_CONFIG,
  URGE_BOSSES,
  ACHIEVEMENTS,
} = require("../constants/disciplineCatalog.js");
const disciplineActivityModel = require("../models/disciplineActivityModel.js");
const disciplineLogModel = require("../models/disciplineLogModel.js");
const disciplineDailySummaryModel = require("../models/disciplineDailySummaryModel.js");
const {
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
} = require("../utils/disciplineEngine.js");

const CHEST_REWARDS = {
  25: { xp: 20, shield: 2, freeze: 0, label: "25% Bronze Supply Chest" },
  50: { xp: 35, shield: 5, freeze: 0, label: "50% Silver Supply Chest" },
  100: { xp: 75, shield: 12, freeze: 1, label: "100% Barakah Grand Chest" },
};

function computeDailyComboCount(logsForDay) {
  let streak = 0;
  for (const log of logsForDay) {
    if (log.entryType === "chest") continue;
    if (log.polarity === "harmful" && log.actionTier === "eliminate_completely") {
      streak = 0;
    } else if (log.polarity !== "harmful") {
      streak += 1;
    }
  }
  return streak;
}

function getLevelSnapshot(profile) {
  const realms = {};
  const realmLevels = {};

  REALM_KEYS.forEach((key) => {
    const prog = getLevelProgress(
      profile.realmXp?.[key] || 0,
      xpStepForRealmLevel,
    );
    realmLevels[key] = prog.level;
    realms[key] = {
      ...REALM_CONFIG[key],
      ...prog,
      rank: getRealmRankInfo(key, prog.level),
    };
  });

  const overall = getLevelProgress(profile.totalXp || 0, xpStepForOverallLevel);
  const masterRank = getMasterRankStatus(realmLevels);

  return { overall, realms, realmLevels, masterRank };
}

function detectLevelUps(beforeSnap, afterSnap) {
  const levelUps = [];
  if (afterSnap.overall.level > beforeSnap.overall.level) {
    levelUps.push({
      scope: "overall",
      label: "Overall Level",
      from: beforeSnap.overall.level,
      to: afterSnap.overall.level,
    });
  }
  REALM_KEYS.forEach((key) => {
    if (afterSnap.realmLevels[key] > beforeSnap.realmLevels[key]) {
      levelUps.push({
        scope: key,
        label: REALM_CONFIG[key].label,
        from: beforeSnap.realmLevels[key],
        to: afterSnap.realmLevels[key],
        newRank: afterSnap.realms[key].rank.title,
      });
    }
  });
  if (afterSnap.masterRank.current.tier > beforeSnap.masterRank.current.tier) {
    levelUps.push({
      scope: "master_rank",
      label: "Commander Rank Promotion",
      from: beforeSnap.masterRank.current.name,
      to: afterSnap.masterRank.current.name,
    });
  }
  return levelUps;
}

async function buildDashboardPayload(adminId, requestedDateKey = null) {
  const profile = await ensureAdminDisciplineInitialized(adminId);
  const cycleInfo = getMaghribCycleInfo(new Date(), profile.settings);
  const activeDateKey =
    requestedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(requestedDateKey)
      ? requestedDateKey
      : cycleInfo.dateKey;

  const [activities, activeDayLogs, summaries, recentHarmfulLogs] =
    await Promise.all([
      disciplineActivityModel
        .find({ adminId, isActive: true })
        .sort({ activityNumber: 1 })
        .lean(),
      disciplineLogModel
        .find({ adminId, dateKey: activeDateKey })
        .sort({ loggedAt: 1, _id: 1 })
        .lean(),
      disciplineDailySummaryModel
        .find({ adminId })
        .sort({ dateKey: 1 })
        .lean(),
      disciplineLogModel
        .find({
          adminId,
          polarity: "harmful",
          dateKey: { $gte: addDaysToDateKey(cycleInfo.dateKey, -29) },
        })
        .lean(),
    ]);

  const summaryByDate = new Map(summaries.map((s) => [s.dateKey, s]));
  const todaySummary = summaryByDate.get(activeDateKey) || {
    dateKey: activeDateKey,
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
    pillarsHit: [],
    closingBaseline: profile.currentBaseline,
    closingShieldHp: profile.shieldHp,
    balancedBonusAwarded: false,
    claimedChests: [],
  };

  const snap = getLevelSnapshot(profile);
  REALM_KEYS.forEach((key) => {
    snap.realms[key].todayXp = todaySummary.realmXp?.[key] || 0;
  });

  const comboCount = computeDailyComboCount(activeDayLogs);
  const comboMultiplier = computeComboMultiplier(comboCount);
  const streakMultiplier = computeStreakMultiplier(
    profile.anchorStreak,
    profile.cleanStreak,
  );

  const dailyQuests = evaluateDailyQuests(todaySummary);

  // Weekly Epic Mission: rolling last 7 Maghrib cycles
  const weekKeys = [];
  for (let i = 6; i >= 0; i -= 1) {
    weekKeys.push(addDaysToDateKey(cycleInfo.dateKey, -i));
  }
  let weekCleanDays = 0;
  let weekBattles = 0;
  let weekNetXp = 0;
  weekKeys.forEach((k) => {
    const s = summaryByDate.get(k);
    if (!s) return;
    if ((s.goodCount || 0) >= 1 && (s.severeTrapCount || 0) === 0) {
      weekCleanDays += 1;
    }
    weekBattles += (s.raidsCount || 0) + (s.bossesCount || 0);
    weekNetXp += s.netXp || 0;
  });

  // Ghost Comparison (Today vs Yesterday vs 7-day Avg vs All-Time Best)
  const yesterdayKey = addDaysToDateKey(cycleInfo.dateKey, -1);
  const yesterdaySummary = summaryByDate.get(yesterdayKey);
  const last7Summaries = weekKeys
    .slice(0, 6)
    .map((k) => summaryByDate.get(k))
    .filter(Boolean);
  const avg7DayXp =
    last7Summaries.length > 0
      ? Math.round(
          last7Summaries.reduce((sum, s) => sum + (s.netXp || 0), 0) /
            last7Summaries.length,
        )
      : 0;
  const bestDayXp = summaries.reduce(
    (max, s) => Math.max(max, s.netXp || 0),
    0,
  );

  // Per-activity counts for activeDateKey
  const dailyActivityCounts = {};
  activeDayLogs.forEach((l) => {
    if (l.activityNumber) {
      dailyActivityCounts[l.activityNumber] =
        (dailyActivityCounts[l.activityNumber] || 0) + 1;
    }
  });

  // Top leaks last 30 days
  const leakMap = new Map();
  recentHarmfulLogs.forEach((l) => {
    const key = l.activityNumber || l.title;
    const prev = leakMap.get(key) || {
      key,
      title: l.title,
      count: 0,
      xpLost: 0,
      baselineLost: 0,
      actionTier: l.actionTier,
    };
    prev.count += 1;
    prev.xpLost += Math.abs(l.totalXpDelta || 0);
    prev.baselineLost += Math.abs(l.baselineDelta || 0);
    leakMap.set(key, prev);
  });
  const topLeaks = Array.from(leakMap.values())
    .sort((a, b) => b.xpLost - a.xpLost)
    .slice(0, 6);

  // Achievements formatted
  const unlockedMap = new Map(
    (profile.unlockedAchievements || []).map((a) => [a.key, a.unlockedAt]),
  );
  const achievements = ACHIEVEMENTS.map((a) => ({
    key: a.key,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: unlockedMap.has(a.key),
    unlockedAt: unlockedMap.get(a.key) || null,
  }));

  // Last 180 days heatmap + 30 day trend
  const heatmapStart = addDaysToDateKey(cycleInfo.dateKey, -180);
  const heatmap = summaries
    .filter((s) => s.dateKey >= heatmapStart)
    .map((s) => ({
      dateKey: s.dateKey,
      netXp: s.netXp || 0,
      goodCount: s.goodCount || 0,
      harmfulCount: s.harmfulCount || 0,
      severeTrapCount: s.severeTrapCount || 0,
      tongueControlCount: s.tongueControlCount || 0,
      tongueLeakCount: s.tongueLeakCount || 0,
      closingBaseline: s.closingBaseline ?? 100,
      balancedBonusAwarded: Boolean(s.balancedBonusAwarded),
      pillarsHit: s.pillarsHit || [],
    }));

  const trend30Start = addDaysToDateKey(cycleInfo.dateKey, -29);
  const trend30 = summaries
    .filter((s) => s.dateKey >= trend30Start)
    .map((s) => ({
      dateKey: s.dateKey,
      netXp: s.netXp || 0,
      closingBaseline: s.closingBaseline ?? 100,
      closingShieldHp: s.closingShieldHp ?? 100,
    }));

  // Recovery recommendations when inRecoveryMode
  const recoverySuggestions = activities
    .filter(
      (a) =>
        a.polarity === "good" &&
        (a.tags?.includes("recovery") ||
          a.tags?.includes("receptor-reset") ||
          a.tags?.includes("cold-wudu") ||
          a.tags?.includes("tongue-control")),
    )
    .slice(0, 6);

  return {
    metadata: DISCIPLINE_METADATA,
    cycleInfo,
    activeDateKey,
    profile: {
      totalXp: profile.totalXp,
      currentBaseline: profile.currentBaseline,
      shieldHp: profile.shieldHp,
      inRecoveryMode: profile.inRecoveryMode,
      anchorStreak: profile.anchorStreak,
      cleanStreak: profile.cleanStreak,
      tongueStreak: profile.tongueStreak,
      bestAnchorStreak: profile.bestAnchorStreak,
      bestCleanStreak: profile.bestCleanStreak,
      bestTongueStreak: profile.bestTongueStreak,
      streakFreezes: profile.streakFreezes,
      raidsCompleted: profile.raidsCompleted,
      bossesDefeated: profile.bossesDefeated,
      settings: profile.settings,
    },
    overall: snap.overall,
    realms: snap.realms,
    masterRank: snap.masterRank,
    combo: {
      count: comboCount,
      multiplier: comboMultiplier,
      streakMultiplier,
    },
    todaySummary,
    todayLogs: [...activeDayLogs].reverse(),
    dailyActivityCounts,
    dailyQuests,
    weeklyMission: {
      cleanDays: weekCleanDays,
      cleanDaysTarget: 5,
      battles: weekBattles,
      battlesTarget: 3,
      weekNetXp,
      completed: weekCleanDays >= 5 && weekBattles >= 3,
    },
    ghostComparison: {
      todayNetXp: todaySummary.netXp || 0,
      yesterdayNetXp: yesterdaySummary?.netXp || 0,
      avg7DayXp,
      bestDayXp,
    },
    activities,
    recoverySuggestions,
    bosses: URGE_BOSSES,
    achievements,
    topLeaks,
    heatmap,
    trend30,
  };
}

const getDashboard = async (req, res) => {
  try {
    const dashboard = await buildDashboardPayload(
      req.result._id,
      req.query.dateKey || null,
    );
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error("getDashboard error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to load discipline dashboard" });
  }
};

const getSummary = async (req, res) => {
  try {
    const adminId = req.result._id;
    const profile = await ensureAdminDisciplineInitialized(adminId);
    const cycleInfo = getMaghribCycleInfo(new Date(), profile.settings);
    const snap = getLevelSnapshot(profile);

    return res.status(200).json({
      overallLevel: snap.overall.level,
      masterRank: snap.masterRank.current,
      shieldHp: profile.shieldHp,
      currentBaseline: profile.currentBaseline,
      anchorStreak: profile.anchorStreak,
      tongueStreak: profile.tongueStreak,
      msUntilReset: cycleInfo.msUntilReset,
      dateKey: cycleInfo.dateKey,
    });
  } catch (error) {
    console.error("getSummary error:", error);
    return res.status(500).json({ message: "Failed to load discipline summary" });
  }
};

const logActivity = async (req, res) => {
  try {
    const adminId = req.result._id;
    const {
      activityId,
      intensityKey = "standard",
      note = "",
      backdateDays = 0,
    } = req.body || {};

    if (!activityId) {
      return res.status(400).json({ message: "activityId is required" });
    }

    const profileBefore = await ensureAdminDisciplineInitialized(adminId);
    const beforeSnap = getLevelSnapshot(profileBefore);
    const cycleInfo = getMaghribCycleInfo(new Date(), profileBefore.settings);

    const safeBackdate = clamp(parseInt(backdateDays, 10) || 0, 0, 2);
    const targetDateKey = addDaysToDateKey(cycleInfo.dateKey, -safeBackdate);

    const activity = await disciplineActivityModel.findOne({
      _id: activityId,
      adminId,
      isActive: true,
    });

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Check daily frequency cap on targetDateKey
    if (activity.dailyCap > 0) {
      const existingCount = await disciplineLogModel.countDocuments({
        adminId,
        dateKey: targetDateKey,
        activityNumber: activity.activityNumber,
      });
      if (existingCount >= activity.dailyCap) {
        return res.status(400).json({
          message: `Daily cap (${activity.dailyCap}/${activity.dailyCap}) already reached for "${activity.name}" in this Maghrib cycle.`,
        });
      }
    }

    const existingLogsForTarget = await disciplineLogModel
      .find({ adminId, dateKey: targetDateKey })
      .sort({ loggedAt: 1 })
      .lean();

    const comboCount = computeDailyComboCount(existingLogsForTarget);
    const comboMultiplier =
      activity.polarity === "harmful"
        ? 1.0
        : computeComboMultiplier(comboCount);
    const streakMultiplier =
      activity.polarity === "harmful"
        ? 1.0
        : computeStreakMultiplier(
            profileBefore.anchorStreak,
            profileBefore.cleanStreak,
          );

    let intensityOption = null;
    if (activity.supportsIntensity && activity.intensityOptions?.length) {
      intensityOption =
        activity.intensityOptions.find((o) => o.key === intensityKey) ||
        activity.intensityOptions[0];
    }
    const intensityMultiplier = intensityOption?.multiplier || 1;

    const totalXpDelta =
      activity.polarity === "harmful"
        ? Math.round(activity.baseXp * intensityMultiplier)
        : Math.round(
            activity.baseXp *
              intensityMultiplier *
              comboMultiplier *
              streakMultiplier,
          );

    const realmDeltas = distributeRealmXp(
      totalXpDelta,
      activity.realmWeights,
      activity.primaryRealm,
    );

    const baselineDelta = Math.round(
      (activity.baselineDelta || 0) * Math.min(1.8, intensityMultiplier),
    );
    const shieldDelta = Math.round(baselineDelta * 1.6);

    const createdLog = await disciplineLogModel.create({
      adminId,
      activityId: activity._id,
      activityNumber: activity.activityNumber,
      entryType: "activity",
      title: activity.name,
      category: activity.category,
      polarity: activity.polarity,
      actionTier: activity.action_tier,
      tags: activity.tags || [],
      hasCrash: Boolean(activity.has_crash),
      dateKey: targetDateKey,
      intensityKey: intensityOption?.key || "standard",
      intensityLabel: intensityOption?.label || "",
      intensityMultiplier,
      comboMultiplier,
      streakMultiplier,
      totalXpDelta,
      realmDeltas,
      baselineDelta,
      shieldDelta,
      note: String(note || "").trim().slice(0, 500),
      loggedAt: new Date(),
    });

    const { profile: profileAfter, newlyUnlocked } =
      await recomputeAdminDisciplineState(adminId);
    const afterSnap = getLevelSnapshot(profileAfter);
    const levelUps = detectLevelUps(beforeSnap, afterSnap);
    const dashboard = await buildDashboardPayload(adminId, targetDateKey);

    return res.status(201).json({
      message:
        totalXpDelta >= 0
          ? `+${totalXpDelta} XP earned!`
          : `${totalXpDelta} XP — Shield took ${Math.abs(shieldDelta)} damage`,
      createdLog,
      levelUps,
      newlyUnlocked,
      dashboard,
    });
  } catch (error) {
    console.error("logActivity error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to log activity" });
  }
};

const deleteLog = async (req, res) => {
  try {
    const adminId = req.result._id;
    const { logId } = req.params;

    const log = await disciplineLogModel.findOne({ _id: logId, adminId });
    if (!log) {
      return res.status(404).json({ message: "Log entry not found" });
    }

    const affectedDateKey = log.dateKey;

    if (log.entryType === "chest" && log.metadata?.chestTier) {
      await disciplineDailySummaryModel.updateOne(
        { adminId, dateKey: affectedDateKey },
        { $pull: { claimedChests: log.metadata.chestTier } },
      );
    }

    if (log.entryType === "auto_dsa" && log.metadata?.problemId) {
      await disciplineDailySummaryModel.updateOne(
        { adminId, dateKey: affectedDateKey },
        { $pull: { syncedProblemIds: String(log.metadata.problemId) } },
      );
    }

    await disciplineLogModel.deleteOne({ _id: log._id, adminId });
    await recomputeAdminDisciplineState(adminId);
    const dashboard = await buildDashboardPayload(adminId, affectedDateKey);

    return res.status(200).json({
      message: "Log undone and stats recalculated cleanly",
      dashboard,
    });
  } catch (error) {
    console.error("deleteLog error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to delete log entry" });
  }
};

const completeFocusRaid = async (req, res) => {
  try {
    const adminId = req.result._id;
    const { focusType = "cse_study", durationMinutes = 50, note = "" } =
      req.body || {};

    const mins = clamp(parseInt(durationMinutes, 10) || 25, 5, 360);
    const profileBefore = await ensureAdminDisciplineInitialized(adminId);
    const beforeSnap = getLevelSnapshot(profileBefore);
    const cycleInfo = getMaghribCycleInfo(new Date(), profileBefore.settings);

    const raidTemplates = {
      cse_study: {
        activityNumber: mins >= 180 ? 88 : 30,
        title: `Focus Raid (${mins}m): Deep CSE Study`,
        category: "cse_academics_and_halal_income",
        tags: ["deep-study", "cse", "raid", mins >= 180 ? "study-marathon" : "focus"],
        realmWeights: { duniya: 0.8, willpower: 0.2 },
        xpPerHour: 52,
        baselineGain: 5,
      },
      dsa_grind: {
        activityNumber: 32,
        title: `Focus Raid (${mins}m): DSA Grind Without Peeking`,
        category: "cse_academics_and_halal_income",
        tags: ["dsa", "deep-study", "raid"],
        realmWeights: { duniya: 0.85, willpower: 0.15 },
        xpPerHour: 56,
        baselineGain: 5,
      },
      quran_ibadah: {
        activityNumber: 7,
        title: `Focus Raid (${mins}m): Quiet Qur'an & Reflection`,
        category: "ibadah_and_spiritual_discipline",
        tags: ["quran", "ibadah", "raid", "extra-ibadah"],
        realmWeights: { imaan: 0.8, willpower: 0.2 },
        xpPerHour: 54,
        baselineGain: 6,
      },
      tongue_silence: {
        activityNumber: 66,
        title: `Focus Raid (${mins}m): Guarded Tongue & Silent Focus`,
        category: "akhlaq_and_guarding_tongue",
        tags: ["tongue-control", "silence", "hifz-al-lisan", "raid"],
        realmWeights: { akhlaq: 0.65, willpower: 0.35 },
        xpPerHour: 50,
        baselineGain: 6,
      },
    };

    const template = raidTemplates[focusType] || raidTemplates.cse_study;

    const existingLogsToday = await disciplineLogModel
      .find({ adminId, dateKey: cycleInfo.dateKey })
      .sort({ loggedAt: 1 })
      .lean();
    const comboMultiplier = computeComboMultiplier(
      computeDailyComboCount(existingLogsToday),
    );
    const streakMultiplier = computeStreakMultiplier(
      profileBefore.anchorStreak,
      profileBefore.cleanStreak,
    );

    const rawXp = Math.max(20, Math.round((mins / 60) * template.xpPerHour * 1.15));
    const totalXpDelta = Math.round(
      rawXp * comboMultiplier * streakMultiplier,
    );
    const realmDeltas = distributeRealmXp(
      totalXpDelta,
      template.realmWeights,
      "duniya",
    );
    const baselineDelta = clamp(
      Math.round((mins / 50) * template.baselineGain),
      2,
      12,
    );

    const createdLog = await disciplineLogModel.create({
      adminId,
      activityNumber: template.activityNumber,
      entryType: "raid",
      title: template.title,
      category: template.category,
      polarity: "good",
      actionTier: "core_goal_and_anchor",
      tags: template.tags,
      hasCrash: false,
      dateKey: cycleInfo.dateKey,
      intensityKey: `${mins}m`,
      intensityLabel: `${mins} Min Raid`,
      intensityMultiplier: Number((mins / 50).toFixed(2)),
      comboMultiplier,
      streakMultiplier,
      totalXpDelta,
      realmDeltas,
      baselineDelta,
      shieldDelta: Math.round(baselineDelta * 1.5),
      note: String(note || "").trim().slice(0, 500),
      metadata: { focusType, durationMinutes: mins },
      loggedAt: new Date(),
    });

    const { profile: profileAfter, newlyUnlocked } =
      await recomputeAdminDisciplineState(adminId);
    const afterSnap = getLevelSnapshot(profileAfter);
    const levelUps = detectLevelUps(beforeSnap, afterSnap);
    const dashboard = await buildDashboardPayload(adminId, cycleInfo.dateKey);

    return res.status(201).json({
      message: `Raid Cleared! +${totalXpDelta} XP`,
      createdLog,
      levelUps,
      newlyUnlocked,
      dashboard,
    });
  } catch (error) {
    console.error("completeFocusRaid error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to complete Focus Raid" });
  }
};

const defeatUrgeBoss = async (req, res) => {
  try {
    const adminId = req.result._id;
    const { bossKey, note = "" } = req.body || {};

    const boss =
      URGE_BOSSES.find((b) => b.key === bossKey) || URGE_BOSSES[0];

    const profileBefore = await ensureAdminDisciplineInitialized(adminId);
    const beforeSnap = getLevelSnapshot(profileBefore);
    const cycleInfo = getMaghribCycleInfo(new Date(), profileBefore.settings);

    const existingLogsToday = await disciplineLogModel
      .find({ adminId, dateKey: cycleInfo.dateKey })
      .sort({ loggedAt: 1 })
      .lean();
    const comboMultiplier = computeComboMultiplier(
      computeDailyComboCount(existingLogsToday),
    );
    const streakMultiplier = computeStreakMultiplier(
      profileBefore.anchorStreak,
      profileBefore.cleanStreak,
    );

    const totalXpDelta = Math.round(
      boss.rewardXp * comboMultiplier * streakMultiplier,
    );

    const isTongueBoss = boss.key === "tongue_ramble" || boss.key === "anger_flare";
    const realmWeights = isTongueBoss
      ? { akhlaq: 0.65, willpower: 0.35 }
      : boss.realm === "duniya"
        ? { duniya: 0.6, willpower: 0.4 }
        : { willpower: 0.75, imaan: 0.25 };

    const realmDeltas = distributeRealmXp(
      totalXpDelta,
      realmWeights,
      boss.realm,
    );

    const tags = isTongueBoss
      ? ["urge-defeated", "tongue-control", "hifz-al-lisan", "sabr"]
      : ["urge-defeated", "dopamine-reset", "recovery", "sabr"];

    const createdLog = await disciplineLogModel.create({
      adminId,
      activityNumber: 93,
      entryType: "boss",
      title: `Boss Defeated: ${boss.name}`,
      category: isTongueBoss
        ? "akhlaq_and_guarding_tongue"
        : "digital_habits_and_desire",
      polarity: "good",
      actionTier: "core_goal_and_anchor",
      tags,
      hasCrash: false,
      dateKey: cycleInfo.dateKey,
      intensityKey: `${boss.durationSeconds}s`,
      intensityLabel: `${boss.durationSeconds}s Victory`,
      intensityMultiplier: 1,
      comboMultiplier,
      streakMultiplier,
      totalXpDelta,
      realmDeltas,
      baselineDelta: Math.round(boss.shieldRepair / 2),
      shieldDelta: boss.shieldRepair,
      note: String(note || "").trim().slice(0, 500),
      metadata: { bossKey: boss.key },
      loggedAt: new Date(),
    });

    const { profile: profileAfter, newlyUnlocked } =
      await recomputeAdminDisciplineState(adminId);
    const afterSnap = getLevelSnapshot(profileAfter);
    const levelUps = detectLevelUps(beforeSnap, afterSnap);
    const dashboard = await buildDashboardPayload(adminId, cycleInfo.dateKey);

    return res.status(201).json({
      message: `${boss.name} Defeated! +${totalXpDelta} XP & +${boss.shieldRepair} Shield Repair`,
      createdLog,
      levelUps,
      newlyUnlocked,
      dashboard,
    });
  } catch (error) {
    console.error("defeatUrgeBoss error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to record Boss Victory" });
  }
};

const claimDailyChest = async (req, res) => {
  try {
    const adminId = req.result._id;
    const tier = Number(req.body?.tier);
    const reward = CHEST_REWARDS[tier];

    if (!reward) {
      return res.status(400).json({ message: "Invalid chest tier (25, 50, or 100)" });
    }

    const profileBefore = await ensureAdminDisciplineInitialized(adminId);
    const beforeSnap = getLevelSnapshot(profileBefore);
    const cycleInfo = getMaghribCycleInfo(new Date(), profileBefore.settings);

    const summary = await disciplineDailySummaryModel.findOne({
      adminId,
      dateKey: cycleInfo.dateKey,
    });

    if (!summary) {
      return res
        .status(400)
        .json({ message: "Complete daily quests first to unlock chests." });
    }

    const questsState = evaluateDailyQuests(summary);
    if (questsState.completionPct < tier) {
      return res.status(400).json({
        message: `Reach ${tier}% daily quest completion before claiming this chest.`,
      });
    }

    if ((summary.claimedChests || []).includes(tier)) {
      return res.status(400).json({ message: `Chest ${tier}% already claimed today.` });
    }

    const realmDeltas = distributeRealmXp(
      reward.xp,
      { imaan: 0.25, duniya: 0.25, willpower: 0.25, akhlaq: 0.25 },
      "imaan",
    );

    await disciplineLogModel.create({
      adminId,
      entryType: "chest",
      title: `Opened ${reward.label}`,
      category: "chest_reward",
      polarity: "good",
      actionTier: "core_goal_and_anchor",
      tags: ["chest-reward"],
      hasCrash: false,
      dateKey: cycleInfo.dateKey,
      totalXpDelta: reward.xp,
      realmDeltas,
      baselineDelta: Math.round(reward.shield / 2),
      shieldDelta: reward.shield,
      metadata: { chestTier: tier },
      loggedAt: new Date(),
    });

    summary.claimedChests.push(tier);
    await summary.save();

    if (reward.freeze > 0 && profileBefore.streakFreezes < 3) {
      profileBefore.streakFreezes = Math.min(
        3,
        profileBefore.streakFreezes + reward.freeze,
      );
      await profileBefore.save();
    }

    const { profile: profileAfter, newlyUnlocked } =
      await recomputeAdminDisciplineState(adminId);
    const afterSnap = getLevelSnapshot(profileAfter);
    const levelUps = detectLevelUps(beforeSnap, afterSnap);
    const dashboard = await buildDashboardPayload(adminId, cycleInfo.dateKey);

    return res.status(200).json({
      message: `Opened ${reward.label}! +${reward.xp} XP${reward.freeze ? " +1 Streak Freeze!" : ""}`,
      levelUps,
      newlyUnlocked,
      dashboard,
    });
  } catch (error) {
    console.error("claimDailyChest error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to claim chest" });
  }
};

const createCustomActivity = async (req, res) => {
  try {
    const adminId = req.result._id;
    await ensureAdminDisciplineInitialized(adminId);

    const {
      name,
      category = "custom",
      polarity = "good",
      primaryRealm = "imaan",
      baseXp = 30,
      baselineDelta = 3,
      dailyCap = 0,
      tags = [],
      impact_on_goal = "",
      action_tier = "keep_and_protect",
      isPinned = false,
      supportsIntensity = false,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Activity name is required" });
    }

    const lastAct = await disciplineActivityModel
      .findOne({ adminId })
      .sort({ activityNumber: -1 })
      .lean();
    const nextNumber = Math.max(1000, (lastAct?.activityNumber || 999) + 1);

    const parsedBaseXp =
      polarity === "harmful"
        ? -Math.abs(parseInt(baseXp, 10) || 25)
        : Math.abs(parseInt(baseXp, 10) || 25);

    const parsedBaselineDelta =
      polarity === "harmful"
        ? -Math.abs(parseInt(baselineDelta, 10) || 5)
        : Math.abs(parseInt(baselineDelta, 10) || 4);

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : String(tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

    const realmWeights = { imaan: 0, duniya: 0, willpower: 0, akhlaq: 0 };
    if (REALM_KEYS.includes(primaryRealm)) {
      realmWeights[primaryRealm] = 1;
    } else {
      realmWeights.imaan = 1;
    }

    const activity = await disciplineActivityModel.create({
      adminId,
      activityNumber: nextNumber,
      category: String(category).trim(),
      polarity,
      name: String(name).trim().slice(0, 200),
      peak_min: polarity === "harmful" ? 140 : 110,
      peak_max: polarity === "harmful" ? 175 : 130,
      aftermath_baseline_min: polarity === "harmful" ? 80 : 103,
      aftermath_baseline_max: polarity === "harmful" ? 90 : 112,
      has_crash: polarity === "harmful",
      dopamine_type: polarity === "harmful" ? "cheap_phasic_spike" : "earned_tonic",
      action_tier,
      impact_on_goal: String(impact_on_goal || "").trim(),
      tags: cleanTags,
      primaryRealm: REALM_KEYS.includes(primaryRealm) ? primaryRealm : "imaan",
      realmWeights,
      baseXp: parsedBaseXp,
      baselineDelta: parsedBaselineDelta,
      dailyCap: Math.max(0, parseInt(dailyCap, 10) || 0),
      supportsIntensity: Boolean(supportsIntensity),
      intensityOptions: supportsIntensity
        ? [
            { key: "standard", label: "Standard (1x)", multiplier: 1 },
            { key: "extended", label: "Extended (1.5x)", multiplier: 1.5 },
            { key: "intense", label: "Intense (2x)", multiplier: 2 },
          ]
        : [],
      isPinned: Boolean(isPinned),
      isCustom: true,
      isActive: true,
    });

    const dashboard = await buildDashboardPayload(adminId);
    return res.status(201).json({
      message: "Custom act added!",
      activity,
      dashboard,
    });
  } catch (error) {
    console.error("createCustomActivity error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to create custom activity" });
  }
};

const updateActivity = async (req, res) => {
  try {
    const adminId = req.result._id;
    const { activityId } = req.params;
    const {
      name,
      baseXp,
      dailyCap,
      isPinned,
      tags,
      isActive,
      impact_on_goal,
    } = req.body || {};

    const activity = await disciplineActivityModel.findOne({
      _id: activityId,
      adminId,
    });
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    if (typeof isPinned === "boolean") activity.isPinned = isPinned;
    if (typeof isActive === "boolean") activity.isActive = isActive;
    if (typeof name === "string" && name.trim()) {
      activity.name = name.trim().slice(0, 200);
    }
    if (typeof impact_on_goal === "string") {
      activity.impact_on_goal = impact_on_goal.trim();
    }
    if (dailyCap !== undefined) {
      activity.dailyCap = Math.max(0, parseInt(dailyCap, 10) || 0);
    }
    if (baseXp !== undefined && !Number.isNaN(Number(baseXp))) {
      const n = Math.round(Number(baseXp));
      activity.baseXp =
        activity.polarity === "harmful" ? -Math.abs(n) : Math.abs(n);
    }
    if (tags !== undefined) {
      activity.tags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
        : String(tags)
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
    }

    await activity.save();
    const dashboard = await buildDashboardPayload(adminId);
    return res.status(200).json({
      message: "Activity updated",
      activity,
      dashboard,
    });
  } catch (error) {
    console.error("updateActivity error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to update activity" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const adminId = req.result._id;
    const profile = await ensureAdminDisciplineInitialized(adminId);
    const {
      maghribHour,
      maghribMinute,
      timezoneOffsetMinutes,
      soundEnabled,
      autoSyncDsa,
    } = req.body || {};

    if (maghribHour !== undefined) {
      profile.settings.maghribHour = clamp(parseInt(maghribHour, 10) || 19, 15, 22);
    }
    if (maghribMinute !== undefined) {
      profile.settings.maghribMinute = clamp(parseInt(maghribMinute, 10) || 0, 0, 59);
    }
    if (timezoneOffsetMinutes !== undefined && !Number.isNaN(Number(timezoneOffsetMinutes))) {
      profile.settings.timezoneOffsetMinutes = clamp(
        parseInt(timezoneOffsetMinutes, 10),
        -720,
        840,
      );
    }
    if (typeof soundEnabled === "boolean") {
      profile.settings.soundEnabled = soundEnabled;
    }
    if (typeof autoSyncDsa === "boolean") {
      profile.settings.autoSyncDsa = autoSyncDsa;
    }

    await profile.save();
    await recomputeAdminDisciplineState(adminId);
    const dashboard = await buildDashboardPayload(adminId);

    return res.status(200).json({
      message: "Discipline settings updated",
      dashboard,
    });
  } catch (error) {
    console.error("updateSettings error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to update settings" });
  }
};

/**
 * Optional non-blocking integration called when an admin submits an Accepted solution on NeatCode.
 */
async function awardAdminDsaSolve(adminUser, problem) {
  try {
    if (!adminUser || adminUser.role !== "admin" || !problem?._id) return null;

    const adminId = adminUser._id;
    const profile = await ensureAdminDisciplineInitialized(adminId);
    if (!profile.settings?.autoSyncDsa) return null;

    const cycleInfo = getMaghribCycleInfo(new Date(), profile.settings);
    const summary = await disciplineDailySummaryModel.findOne({
      adminId,
      dateKey: cycleInfo.dateKey,
    });

    const problemIdStr = String(problem._id);
    if (summary?.syncedProblemIds?.includes(problemIdStr)) {
      return null;
    }

    const dsaActivity = await disciplineActivityModel.findOne({
      adminId,
      activityNumber: 32,
    });
    if (!dsaActivity) return null;

    const existingLogsToday = await disciplineLogModel
      .find({ adminId, dateKey: cycleInfo.dateKey })
      .sort({ loggedAt: 1 })
      .lean();
    const comboMultiplier = computeComboMultiplier(
      computeDailyComboCount(existingLogsToday),
    );
    const streakMultiplier = computeStreakMultiplier(
      profile.anchorStreak,
      profile.cleanStreak,
    );

    const totalXpDelta = Math.round(
      dsaActivity.baseXp * comboMultiplier * streakMultiplier,
    );
    const realmDeltas = distributeRealmXp(
      totalXpDelta,
      dsaActivity.realmWeights,
      "duniya",
    );

    await disciplineLogModel.create({
      adminId,
      activityId: dsaActivity._id,
      activityNumber: 32,
      entryType: "auto_dsa",
      title: `NeatCode Solved: ${problem.title}`,
      category: dsaActivity.category,
      polarity: "good",
      actionTier: dsaActivity.action_tier,
      tags: dsaActivity.tags || ["dsa", "neatcode"],
      hasCrash: false,
      dateKey: cycleInfo.dateKey,
      comboMultiplier,
      streakMultiplier,
      totalXpDelta,
      realmDeltas,
      baselineDelta: dsaActivity.baselineDelta || 4,
      shieldDelta: Math.round((dsaActivity.baselineDelta || 4) * 1.6),
      note: `Auto-synced from Accepted submission (${problem.difficulty || "problem"})`,
      metadata: { problemId: problemIdStr },
      loggedAt: new Date(),
    });

    await disciplineDailySummaryModel.updateOne(
      { adminId, dateKey: cycleInfo.dateKey },
      { $addToSet: { syncedProblemIds: problemIdStr } },
      { upsert: true },
    );

    await recomputeAdminDisciplineState(adminId);
    return { awardedXp: totalXpDelta };
  } catch (err) {
    console.error("awardAdminDsaSolve non-blocking error:", err.message);
    return null;
  }
}

module.exports = {
  getDashboard,
  getSummary,
  logActivity,
  deleteLog,
  completeFocusRaid,
  defeatUrgeBoss,
  claimDailyChest,
  createCustomActivity,
  updateActivity,
  updateSettings,
  awardAdminDsaSolve,
};
