const mongoose = require("mongoose");
const { Schema } = mongoose;

const disciplineDailySummarySchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    dateKey: { type: String, required: true },
    netXp: { type: Number, default: 0 },
    positiveXp: { type: Number, default: 0 },
    negativeXp: { type: Number, default: 0 },
    realmXp: {
      imaan: { type: Number, default: 0 },
      duniya: { type: Number, default: 0 },
      willpower: { type: Number, default: 0 },
      akhlaq: { type: Number, default: 0 },
    },
    goodCount: { type: Number, default: 0 },
    harmfulCount: { type: Number, default: 0 },
    severeTrapCount: { type: Number, default: 0 },
    imaanAnchorCount: { type: Number, default: 0 },
    duniyaStudyCount: { type: Number, default: 0 },
    tongueControlCount: { type: Number, default: 0 },
    tongueLeakCount: { type: Number, default: 0 },
    raidsCount: { type: Number, default: 0 },
    bossesCount: { type: Number, default: 0 },
    pillarsHit: [{ type: String }],
    closingBaseline: { type: Number, default: 100 },
    closingShieldHp: { type: Number, default: 100 },
    balancedBonusAwarded: { type: Boolean, default: false },
    claimedChests: [{ type: Number }],
    syncedProblemIds: [{ type: String }],
  },
  { timestamps: true },
);

disciplineDailySummarySchema.index(
  { adminId: 1, dateKey: 1 },
  { unique: true },
);

const disciplineDailySummaryModel = mongoose.model(
  "disciplineDailySummary",
  disciplineDailySummarySchema,
);

module.exports = disciplineDailySummaryModel;
