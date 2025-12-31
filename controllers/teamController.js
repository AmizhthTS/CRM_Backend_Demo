import { Team } from "../models/Team.js";
import bcrypt from "bcryptjs";

import { sendEmail } from "../config/mailer.js";

const buildTeamQuery = (filters) => {
  const query = {};

  // Search by order text
  if (filters.search) {
    query.$or = [{ name: { $regex: filters.search, $options: "i" } }];
  }

  return query;
};
// ============= HELPER FUNCTIONS =============

/**
 * Generate auto password based on email and phone number
 * Format: first part of email (before @) + last 4 digits of phone
 * Example: email: john@example.com, phone: 9876543210 -> john3210
 */
function generateAutoPassword(email, phoneNumber) {
  const emailPrefix = email.split("@")[0];
  const phoneSuffix = phoneNumber.slice(-4);
  return `${emailPrefix}${phoneSuffix}`;
}
// create team
export const teamSave = async (req, res) => {
  try {
    let { name, email, password, phoneNumber, image, role } = req.body;

    // Validation
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Name, email, and phoneNumber are required",
        },
      });
    }

    const existingUser = await Team.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        response: {
          responseStatus: 409,
          responseMessage: "Email already registered",
        },
      });
    }

    // Auto-generate password if not provided
    if (!password) {
      password = generateAutoPassword(email, phoneNumber);
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await Team.create({
      name,
      email,
      password: hashedPass,
      phoneNumber,
      image,
      role: role || "admin",
    });
    // Send welcome email using template
    const roleDisplay =
      role === "teammember"
        ? "Team Member"
        : role === "orgadmin"
        ? "Organization Admin"
        : role.charAt(0).toUpperCase() + role.slice(1);

    const emailResult = await sendEmail({
      to: email,
      type: "REGISTER",
      context: {
        name,
        email,
        password,
        roleDisplay,
        loginUrl: `${
          process.env.FRONTEND_URL || "http://localhost:8080"
        }/login`,
        year: new Date().getFullYear(),
      },
    });

    if (!emailResult.success) {
      console.warn("User created but email sending failed:", emailResult.error);
    }
    return res.status(201).json({
      response: {
        responseStatus: 201,
        responseMessage: "User registered successfully",
      },
      emailSent: emailResult.success,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        customerID: newUser.customerID,
      },
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
};
// get team list
export const teamList = async (req, res) => {
  try {
    const { page, limit, search } = req.body;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Invalid page or limit value",
        },
      });
    }
    const query = buildTeamQuery({ search });
    const skip = (pageNum - 1) * limitNum;

    const total = await Team.countDocuments(query);

    const team = await Team.find(query).limit(limitNum).skip(skip).lean();
    team.forEach((team) => {
      team.createdAt = team.createdAt.toISOString().split("T")[0];
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Team fetched successfully",
      },
      team,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get team by id
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Team fetched successfully",
      },
      team,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// delete team
export const teamDelete = async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Team deleted successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update team
export const teamUpdate = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Team updated successfully",
      },
      team,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
