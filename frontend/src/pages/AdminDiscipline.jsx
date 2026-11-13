import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router";
import toast from "react-hot-toast";
import AppNav from "../components/AppNav";
import axiosClient from "../utils/axiosClient";
import CitadelHeader from "../components/discipline/CitadelHeader";
import RealmTowersGrid from "../components/discipline/RealmTowersGrid";
import QuestsAndChestsBar from "../components/discipline/QuestsAndChestsBar";
import QuickLogArena from "../components/discipline/QuickLogArena";
import FocusRaidAndBossPanel, {
  UrgeBossModal,
} from "../components/discipline/FocusRaidAndBossPanel";
import AnalyticsAndHeatmap from "../components/discipline/AnalyticsAndHeatmap";
import TrophiesAndSettingsPanel from "../components/discipline/TrophiesAndSettingsPanel";
import {
  playBossVictory,
  playChestOpen,
  playLevelUp,
  playShieldDamage,
  playXpGain,
} from "../utils/disciplineSfx";

const TABS = [
  { key: "log", label: "Citadel & Quick Log" },
  { key: "battle", label: "Focus Raid & Bosses" },
  { key: "analytics", label: "Heatmap & Insights" },
  { key: "trophies", label: "Trophies & Maghrib Setup" },
];

export default function AdminDiscipline() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("log");
  const [selectedRealm, setSelectedRealm] = useState("all");
  const [backdateDays, setBackdateDays] = useState(0);

  const [loggingId, setLoggingId] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [claimingTier, setClaimingTier] = useState(null);
  const [submittingBattle, setSubmittingBattle] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingAct, setCreatingAct] = useState(false);

  const [bossModalKey, setBossModalKey] = useState(null);
  const [celebration, setCelebration] = useState(null);

  const soundOn = dashboard?.profile?.settings?.soundEnabled ?? true;

  const shiftCycleDateKey = (baseKey, backDays) => {
    if (!baseKey || !backDays) return "";
    const [y, m, d] = baseKey.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    dt.setUTCDate(dt.getUTCDate() - backDays);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  };

  const fetchDashboard = useCallback(async (dateKeyOverride = "") => {
    try {
      const qs = dateKeyOverride
        ? `?dateKey=${encodeURIComponent(dateKeyOverride)}`
        : "";
      const { data } = await axiosClient.get(`/admin/discipline/dashboard${qs}`);
      setDashboard(data);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load Discipline Citadel",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    axiosClient
      .get("/admin/discipline/dashboard")
      .then(({ data }) => {
        if (active) setDashboard(data);
      })
      .catch((err) => {
        if (active) {
          toast.error(
            err?.response?.data?.message || "Failed to load Discipline Citadel",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChangeBackdate = async (days) => {
    setBackdateDays(days);
    const baseKey = dashboard?.cycleInfo?.dateKey;
    const targetKey = days === 0 ? baseKey : shiftCycleDateKey(baseKey, days);
    setRefreshing(true);
    await fetchDashboard(targetKey);
  };

  const triggerCelebrationIfAny = (data) => {
    const levelUps = data?.levelUps || [];
    const newlyUnlocked = data?.newlyUnlocked || [];
    if (levelUps.length > 0 || newlyUnlocked.length > 0) {
      playLevelUp(soundOn);
      setCelebration({ levelUps, newlyUnlocked });
      return true;
    }
    return false;
  };

  const handleLogActivity = async (activityId, intensityKey = "standard", note = "") => {
    setLoggingId(activityId);
    try {
      const { data } = await axiosClient.post("/admin/discipline/log", {
        activityId,
        intensityKey,
        note,
        backdateDays,
      });
      setDashboard(data.dashboard);
      const isNegative = (data?.createdLog?.totalXpDelta || 0) < 0;
      const celebrated = triggerCelebrationIfAny(data);
      if (!celebrated) {
        if (isNegative) playShieldDamage(soundOn);
        else playXpGain(soundOn);
      }
      if (isNegative) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
      }
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log activity");
      return false;
    } finally {
      setLoggingId(null);
    }
  };

  const handleDeleteLog = async (logId) => {
    setDeletingLogId(logId);
    try {
      const { data } = await axiosClient.delete(`/admin/discipline/log/${logId}`);
      setDashboard(data.dashboard);
      toast.success("Entry undone & ranks recalculated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to undo log");
    } finally {
      setDeletingLogId(null);
    }
  };

  const handleTogglePin = async (act) => {
    try {
      const { data } = await axiosClient.patch(
        `/admin/discipline/activities/${act._id}`,
        { isPinned: !act.isPinned },
      );
      setDashboard(data.dashboard);
      toast.success(act.isPinned ? "Unpinned from Core Anchors" : "Pinned to Core Anchors");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update pin");
    }
  };

  const handleClaimChest = async (tier) => {
    setClaimingTier(tier);
    try {
      const { data } = await axiosClient.post("/admin/discipline/chest/claim", {
        tier,
      });
      setDashboard(data.dashboard);
      const celebrated = triggerCelebrationIfAny(data);
      if (!celebrated) playChestOpen(soundOn);
      toast.success(data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to claim chest");
    } finally {
      setClaimingTier(null);
    }
  };

  const handleCompleteRaid = async (focusType, durationMinutes, note) => {
    setSubmittingBattle(true);
    try {
      const { data } = await axiosClient.post("/admin/discipline/raid/complete", {
        focusType,
        durationMinutes,
        note,
      });
      setDashboard(data.dashboard);
      const celebrated = triggerCelebrationIfAny(data);
      if (!celebrated) playBossVictory(soundOn);
      toast.success(data.message);
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record Focus Raid");
      return false;
    } finally {
      setSubmittingBattle(false);
    }
  };

  const handleDefeatBoss = async (bossKey, note) => {
    setSubmittingBattle(true);
    try {
      const { data } = await axiosClient.post("/admin/discipline/boss/defeat", {
        bossKey,
        note,
      });
      setDashboard(data.dashboard);
      setBossModalKey(null);
      const celebrated = triggerCelebrationIfAny(data);
      if (!celebrated) playBossVictory(soundOn);
      toast.success(data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to defeat boss");
    } finally {
      setSubmittingBattle(false);
    }
  };

  const handleCreateActivity = async (payload) => {
    setCreatingAct(true);
    try {
      const { data } = await axiosClient.post("/admin/discipline/activities", payload);
      setDashboard(data.dashboard);
      toast.success("Custom act added to your catalog!");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create custom act");
      return false;
    } finally {
      setCreatingAct(false);
    }
  };

  const handleUpdateSettings = async (settingsPayload) => {
    setSavingSettings(true);
    try {
      const { data } = await axiosClient.patch(
        "/admin/discipline/settings",
        settingsPayload,
      );
      setDashboard(data.dashboard);
      toast.success(data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleSound = () => {
    handleUpdateSettings({ soundEnabled: !soundOn });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <AppNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm font-semibold text-base-content/65">
              Loading your Admin Discipline Citadel...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <AppNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="p-6 rounded-2xl border border-base-300 bg-base-100 text-center space-y-3 max-w-md">
            <h2 className="text-lg font-bold">Could not load Citadel</h2>
            <button
              type="button"
              onClick={() => fetchDashboard()}
              className="btn btn-primary btn-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/70 flex flex-col text-base-content">
      <AppNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <NavLink
            to="/admin"
            className="text-xs font-semibold text-base-content/65 hover:text-primary inline-flex items-center gap-1"
          >
            ← Back to Admin Panel
          </NavLink>
          <span className="text-xs font-mono text-base-content/55">
            Strict Admin-Only • Deen & Duniya Muhasabah Engine
          </span>
        </div>

        {/* Hero Citadel Banner */}
        <CitadelHeader
          dashboard={dashboard}
          onOpenBossArena={() =>
            setBossModalKey(dashboard.bosses?.[0]?.key || "scroll_illusion")
          }
          onToggleSound={handleToggleSound}
          onRefresh={() => {
            setRefreshing(true);
            fetchDashboard(
              backdateDays === 0
                ? ""
                : shiftCycleDateKey(dashboard?.cycleInfo?.dateKey, backdateDays),
            );
          }}
          refreshing={refreshing}
        />

        {/* 4 Independent Realm Towers */}
        <RealmTowersGrid
          realms={dashboard.realms}
          selectedRealm={selectedRealm}
          onSelectRealm={(r) => {
            setSelectedRealm(r);
            setActiveTab("log");
          }}
        />

        {/* Daily Missions & Supply Chests */}
        <QuestsAndChestsBar
          dailyQuests={dashboard.dailyQuests}
          weeklyMission={dashboard.weeklyMission}
          todaySummary={dashboard.todaySummary}
          streakFreezes={dashboard.profile?.streakFreezes || 0}
          onClaimChest={handleClaimChest}
          claimingTier={claimingTier}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-base-300 pb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`btn btn-sm rounded-xl font-bold ${
                activeTab === t.key
                  ? "btn-primary shadow-xs"
                  : "btn-ghost bg-base-100 border border-base-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        {activeTab === "log" && (
          <QuickLogArena
            dashboard={dashboard}
            selectedRealm={selectedRealm}
            onSelectRealm={setSelectedRealm}
            backdateDays={backdateDays}
            onChangeBackdate={handleChangeBackdate}
            onLogActivity={handleLogActivity}
            onDeleteLog={handleDeleteLog}
            onTogglePin={handleTogglePin}
            loggingId={loggingId}
            deletingLogId={deletingLogId}
          />
        )}

        {activeTab === "battle" && (
          <FocusRaidAndBossPanel
            bosses={dashboard.bosses}
            onCompleteRaid={handleCompleteRaid}
            onOpenBossModal={(key) => setBossModalKey(key)}
            submitting={submittingBattle}
          />
        )}

        {activeTab === "analytics" && <AnalyticsAndHeatmap dashboard={dashboard} />}

        {activeTab === "trophies" && (
          <TrophiesAndSettingsPanel
            dashboard={dashboard}
            onCreateActivity={handleCreateActivity}
            onUpdateSettings={handleUpdateSettings}
            savingSettings={savingSettings}
            creatingAct={creatingAct}
          />
        )}
      </main>

      {/* Emergency Boss Battle Modal */}
      {bossModalKey && (
        <UrgeBossModal
          bosses={dashboard.bosses}
          activeBossKey={bossModalKey}
          onClose={() => setBossModalKey(null)}
          onDefeatBoss={handleDefeatBoss}
          submitting={submittingBattle}
        />
      )}

      {/* Level Up & Achievement Celebration Modal */}
      {celebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-amber-400/70 bg-base-100 p-6 shadow-2xl text-center space-y-4">
            <div className="text-4xl">⚡🏆⚡</div>
            <h2 className="text-2xl font-black text-base-content">
              LEVEL UP & PROMOTION!
            </h2>

            {celebration.levelUps?.length > 0 && (
              <div className="space-y-2 text-left">
                {celebration.levelUps.map((u, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-sm"
                  >
                    <div className="font-bold text-primary">{u.label}</div>
                    <div className="font-mono text-xs mt-0.5">
                      {u.from} → <strong className="text-base-content">{u.to}</strong>
                      {u.newRank ? ` (${u.newRank})` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {celebration.newlyUnlocked?.length > 0 && (
              <div className="space-y-2 text-left">
                {celebration.newlyUnlocked.map((ach) => (
                  <div
                    key={ach.key}
                    className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-sm"
                  >
                    <div className="font-extrabold text-amber-500">
                      Trophy Unlocked: {ach.title}
                    </div>
                    <div className="text-xs text-base-content/75 mt-0.5">
                      {ach.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="btn btn-primary w-full font-bold"
            >
              Alhamdulillah — Keep Climbing!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
