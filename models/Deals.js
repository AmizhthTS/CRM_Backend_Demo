import mongoose from "mongoose";
const { Schema } = mongoose;

const dealsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    stage: {
      type: String,
      enum: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      required: true,
    },
    expectedCloseDate: {
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
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contacts",
      required: true,
    },
    contactName: {
      type: String,
    },
    companyName: {
      type: String,
    },
    companyId: {
      type: String,
    },
    probability: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    assignBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    ownerDetails: {
      name: {
        type: String,
      },
      image: {
        type: String,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    stageHistory: [
      {
        stage: {
          type: String,
          enum: [
            "lead",
            "qualified",
            "proposal",
            "negotiation",
            "closed_won",
            "closed_lost",
          ],
          required: true,
        },
        stageDate: {
          type: Date,
          default: Date.now,
        },
        message: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Deals = mongoose.model("deals", dealsSchema);
