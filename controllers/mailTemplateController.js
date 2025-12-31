import { MailTemplate } from "../models/MailTemplate.js";

export async function createMailTemplate(req, res) {
  try {
    const { subject, template, type } = req.body;

    // Validation
    if (!subject || !template || !type) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Subject, template, and type are required",
        },
      });
    }

    const newMailTemplate = await MailTemplate.create({
      subject,
      template,
      type,
    });

    return res.status(201).json({
      response: {
        responseStatus: 201,
        responseMessage: "Mail template created successfully",
      },
      mailTemplate: newMailTemplate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      response: {
        responseStatus: 500,
        responseMessage: "Server error",
      },
    });
  }
}
