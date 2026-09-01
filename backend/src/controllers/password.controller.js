const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Do not reveal whether an account exists.
     */
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, a password reset link has been generated.",
      });
    }

    /*
     * Generate secure random token.
     */
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    /*
     * Store only the hashed token in MongoDB.
     */
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    /*
     * Token expires after 15 minutes.
     */
    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    /*
     * Development reset URL.
     *
     * Later we can replace this with
     * an actual email service.
     */
    const resetUrl =
      `http://localhost:3000/reset-password?token=${resetToken}`;

    console.log("");
    console.log(
      "=========================================="
    );
    console.log("PASSWORD RESET REQUEST");
    console.log(
      "=========================================="
    );
    console.log("Email:", user.email);
    console.log("Reset URL:");
    console.log(resetUrl);
    console.log(
      "Token expires in 15 minutes."
    );
    console.log(
      "=========================================="
    );
    console.log("");

    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset link has been generated.",
    });
  } catch (error) {
    console.error(
      "Password reset request error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while requesting the password reset",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const {
      token,
      password,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    /*
     * Hash the token received from frontend
     * so it can be compared with MongoDB.
     */
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,

      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired password reset link",
      });
    }

    /*
     * Hash the new password.
     */
    const hashedPassword =
      await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    /*
     * Invalidate the reset token.
     */
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    console.log(
      `Password successfully reset for: ${user.email}`
    );

    return res.status(200).json({
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while resetting the password",
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};