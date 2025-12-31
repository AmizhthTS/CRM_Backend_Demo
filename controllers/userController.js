import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { sendEmail } from "../config/mailer.js";

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

// ============= AUTHENTICATION ROUTES =============

// REGISTER USER
export async function registerUser(req, res) {
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

    const existingUser = await User.findOne({ email });
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

    const newUser = await User.create({
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
}

// LOGIN USER
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Email and password are required",
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        response: {
          responseStatus: 401,
          responseMessage: "Invalid email or password",
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        response: {
          responseStatus: 401,
          responseMessage: "Invalid email or password",
        },
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        phoneNumber: user.phoneNumber,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "Login successful",
      },
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        customerID: user.customerID,
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
}

// LOGOUT USER
export async function logoutUser(req, res) {
  try {
    // JWT is stateless, logout is handled client-side by removing token
    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "Logged out successfully",
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
}

// ============= USER PROFILE ROUTES =============

// GET USER BY ID
export async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "User fetched successfully",
      },
      user,
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

// PUT - FULL UPDATE USER
export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { name, email, phoneNumber } = req.body;

    // Validation
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Name and email are required",
        },
      });
    }

    // Check if email is unique (if changing email)
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(409).json({
        response: {
          responseStatus: 409,
          responseMessage: "Email already in use",
        },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phoneNumber },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "User updated successfully",
      },
      user: updatedUser,
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

// PATCH - PARTIAL UPDATE USER (name only)
export async function patchUser(req, res) {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    // Safeguard: reject if trying to update protected fields
    const protectedFields = [
      "email",
      "password",
      "role",
      "_id",
      "createdAt",
      "phoneNumber",
    ];
    const hasProtectedFields = protectedFields.some((field) =>
      req.body.hasOwnProperty(field)
    );

    if (hasProtectedFields) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage:
            "Cannot update protected fields: email, password, role, phoneNumber",
        },
      });
    }

    if (!name) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Name is required for update",
        },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "User updated successfully",
      },
      user: updatedUser,
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

// CHANGE PASSWORD
export async function changePassword(req, res) {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Current and new passwords are required",
        },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "New password must be at least 8 characters",
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        response: {
          responseStatus: 401,
          responseMessage: "Current password is incorrect",
        },
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage:
            "New password must be different from current password",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "Password changed successfully",
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
}

// DELETE USER
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "User deleted successfully",
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
}

// ============= ADMIN ROUTES =============

// GET ALL USERS (ADMIN ONLY)
export async function getAllUsers(req, res) {
  try {
    const { role, page = 1, limit = 10, search, isActive } = req.query;

    // Build query
    const query = {};
    if (role !== "all") {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    query.isActive = isActive;
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "Users fetched successfully",
      },
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
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
// UPDATE USER ROLE (ADMIN ONLY)
export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ["admin", "manager", "staff", "user", "wholesalerUser"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: `Invalid role. Valid roles: ${validRoles.join(
            ", "
          )}`,
        },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "User role updated successfully",
      },
      user: updatedUser,
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
// TOGGLE USER ACTIVE STATUS (ADMIN ONLY)
export async function toggleUserActive(req, res) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validation
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "isActive must be a boolean value",
        },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "User not found",
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: `User ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      },
      user: updatedUser,
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
