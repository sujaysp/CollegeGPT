const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error(
        "GOOGLE_CLIENT_ID is missing from environment variables"
      );

      return res.status(500).json({
        message: "Google authentication is not configured",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from environment variables"
      );

      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        message: "Invalid Google account information",
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({
        message: "Google email could not be verified",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find existing user
    let user = await User.findOne({
      email: normalizedEmail,
    });

    // Create user if they don't already exist
    if (!user) {
      /*
       * Google users do not provide a password.
       * We generate a random hashed password so the
       * existing User model can still be used.
       */
      const randomPassword =
        `${googleId}-${Date.now()}-${Math.random()}`;

      const hashedPassword = await bcrypt.hash(
        randomPassword,
        10
      );

      user = await User.create({
        name: name || "CollegeGPT Student",
        email: normalizedEmail,
        password: hashedPassword,
      });

      console.log(
        `New Google user created: ${normalizedEmail}`
      );
    }

    // Create CollegeGPT JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log(
      `Google login successful: ${normalizedEmail}`
    );

    return res.status(200).json({
      message: "Google login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: picture || null,
      },
    });
  } catch (error) {
    console.error(
      "Google login error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Google authentication failed. Please try again.",
    });
  }
};

module.exports = {
  googleLogin,
};