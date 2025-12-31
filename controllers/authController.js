import { Team } from "../models/Team.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// LOGIN USER
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await Team.findOne({ email });
    if (!user)
      return res.status(400).send({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).send({ msg: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).send({
      response: {
        responseStatus: 200,
        responseMessage: "Login Successful",
      },
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      image: user.image,
      customerID: user.customerID,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
}
// logout user
export async function logoutUser(req, res) {
  try {
    // Clear the token from the client's storage (e.g., cookies or local storage)
    res.clearCookie("token");
    return res.status(200).send({ msg: "Logout Successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
}
