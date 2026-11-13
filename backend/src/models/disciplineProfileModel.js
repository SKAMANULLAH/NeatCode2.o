const mongoose = require("mongoose");
const { Schema } = mongoose;

const disciplineProfileSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    totalXp: { type: Number, default: 0, min: 0 },
    realmXp: {
      imaan: { type: Number, default: 0, min: 0 },
      duniya: { type: Number, default: 0, min: 0 },
      willpower: { type: Number, default: 0, min: 0 },
      akhlaq: { type: Number, default: 0, min: 0 },
    },
    currentBaseline: { type: Number, default: 100 },
    shieldHp: { type: Number, default: 100 },
    inRecoveryMode: { type: Boolean, default: false },
    anchorStreak: { type: Number, default: 0 },
    cleanStreak: { type: Number, default: 0 },
    tongueStreak: { type: Number, default: 0 },
    bestAnchorStreak: { type: Number, default: 0 },
    bestCleanStreak: { type: Number, default: 0 },
    bestTongueStreak: { type: Number, default: 0 },
    streakFreezes: { type: Number, default: 1 },
    raidsCompleted: { type: Number, default: 0 },
    bossesDefeated: { type: Number, default: 0 },
    unlockedAchievements: [
      {
        key: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      maghribHour: { type: Number, default: 19, min: 15, max: 22 },
      maghribMinute: { type: Number, default: 0, min: 0, max: 59 },
      timezoneOffsetMinutes: { type: Number, default: 330 },
      soundEnabled: { type: Boolean, default: true },
      autoSyncDsa: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

const disciplineProfileModel = mongoose.model(
  "disciplineProfile",
  disciplineProfileSchema,
);

module.exports = disciplineProfileModel;
