const mongoose = require("mongoose");
const { Schema } = mongoose;

const intensityOptionSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    multiplier: { type: Number, required: true, min: 0.25, max: 5 },
  },
  { _id: false },
);

const disciplineActivitySchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    activityNumber: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    polarity: {
      type: String,
      enum: ["good", "neutral_positive", "harmful"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    peak_min: { type: Number, default: 100 },
    peak_max: { type: Number, default: 110 },
    peak_note: { type: String, default: null },
    aftermath_baseline_min: { type: Number, default: 100 },
    aftermath_baseline_max: { type: Number, default: 105 },
    has_crash: { type: Boolean, default: false },
    dopamine_type: { type: String, default: "earned_tonic", trim: true },
    action_tier: {
      type: String,
      enum: [
        "core_goal_and_anchor",
        "keep_and_protect",
        "guard_against_trap",
        "eliminate_completely",
      ],
      default: "keep_and_protect",
    },
    impact_on_goal: { type: String, default: "", trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    primaryRealm: {
      type: String,
      enum: ["imaan", "duniya", "willpower", "akhlaq"],
      required: true,
    },
    realmWeights: {
      imaan: { type: Number, default: 0 },
      duniya: { type: Number, default: 0 },
      willpower: { type: Number, default: 0 },
      akhlaq: { type: Number, default: 0 },
    },
    baseXp: { type: Number, required: true },
    baselineDelta: { type: Number, default: 0 },
    dailyCap: { type: Number, default: 0, min: 0 },
    supportsIntensity: { type: Boolean, default: false },
    intensityOptions: { type: [intensityOptionSchema], default: [] },
    isPinned: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

disciplineActivitySchema.index(
  { adminId: 1, activityNumber: 1 },
  { unique: true },
);

const disciplineActivityModel = mongoose.model(
  "disciplineActivity",
  disciplineActivitySchema,
);

module.exports = disciplineActivityModel;
