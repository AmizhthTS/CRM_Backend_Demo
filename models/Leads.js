import mongoose from "mongoose";
const { Schema } = mongoose;
const leadsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    companyName: {
      type: String,
    },
    source: {
      type: String,
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
    },
    teamName: {
      type: String,
    },
    teamImage: {
      type: String,
    },
    notes: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      default: "new",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Leads = mongoose.model("leads", leadsSchema);
