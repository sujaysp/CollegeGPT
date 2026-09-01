const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request received");
    console.log("Login email:", email);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    /*
     * Google accounts do not have a local password.
     */
    if (!user.password) {
      return res.status(401).json({
        message:
          "This account uses Google Login. Please continue with Google.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from environment variables"
      );

      return res.status(500).json({
        message:
          "Authentication configuration error",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture || "",
        authProvider:
          user.authProvider,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while logging in",
    });
  }
};

module.exports = {
  loginUser,
};