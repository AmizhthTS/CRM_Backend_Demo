import mongoose from "mongoose";
const { Schema } = mongoose;
const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "overdue"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["meeting", "call", "email", "follow_up", "other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignTo: {
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
    },
    assignedToName: {
      type: String,
    },
    assignedToImage: {
      type: String,
    },
    assignBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: false,
    },
    createdOn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model("task", taskSchema);
