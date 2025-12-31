import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    companySize: {
      type: String,
      required: true,
    },
    revenue: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    contactCountry: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model("company", companySchema);
