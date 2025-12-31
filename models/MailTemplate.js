import mongoose from "mongoose";
const mailTemplateSchema = mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const MailTemplate = mongoose.model("mailTemplate", mailTemplateSchema);
