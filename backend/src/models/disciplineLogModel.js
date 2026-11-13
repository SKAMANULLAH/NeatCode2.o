const mongoose = require("mongoose");
const { Schema } = mongoose;

const disciplineLogSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "disciplineActivity",
      default: null,
    },
    activityNumber: { type: Number, default: null },
    entryType: {
      type: String,
      enum: ["activity", "raid", "boss", "chest", "auto_dsa"],
      default: "activity",
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "general" },
    polarity: {
      type: String,
      enum: ["good", "neutral_positive", "harmful"],
      required: true,
    },
    actionTier: { type: String, default: "keep_and_protect" },
    tags: [{ type: String, trim: true }],
    hasCrash: { type: Boolean, default: false },
    dateKey: { type: String, required: true, index: true },
    intensityKey: { type: String, default: "standard" },
    intensityLabel: { type: String, default: "" },
    intensityMultiplier: { type: Number, default: 1 },
    comboMultiplier: { type: Number, default: 1 },
    streakMultiplier: { type: Number, default: 1 },
    cappedOut: { type: Boolean, default: false },
    totalXpDelta: { type: Number, required: true, default: 0 },
    realmDeltas: {
      imaan: { type: Number, default: 0 },
      duniya: { type: Number, default: 0 },
      willpower: { type: Number, default: 0 },
      akhlaq: { type: Number, default: 0 },
    },
    baselineDelta: { type: Number, default: 0 },
    shieldDelta: { type: Number, default: 0 },
    note: { type: String, default: "", maxLength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    loggedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

disciplineLogSchema.index({ adminId: 1, dateKey: 1, loggedAt: -1 });

const disciplineLogModel = mongoose.model(
  "disciplineLog",
  disciplineLogSchema,
);

module.exports = disciplineLogModel;
