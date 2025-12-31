import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const teamSchema = mongoose.Schema(
  {
    customerID: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "teammember", "orgadmin"], // 'manager', 'staff'
      default: "user",
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
// 🔥 Role-based customerID auto-generation
teamSchema.pre("save", async function (next) {
  if (this.customerID) return next(); // Already generated? skip.

  try {
    // Mapping role → prefix
    const prefixMap = {
      admin: "ADM_",
      teammember: "TM_",
      orgadmin: "ORG_",
      manager: "MAN_",
    };

    const prefix = prefixMap[this.role] || "ADM_";
    console.log("prefix", prefix, this.role);

    // Use role as the counter key
    const counter = await Counter.findOneAndUpdate(
      { key: this.role },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const padded = String(counter.seq).padStart(3, "0");

    this.customerID = `${prefix}_${padded}`;
    next();
  } catch (err) {
    next(err);
  }
});
export const Team = mongoose.model("teams", teamSchema);
