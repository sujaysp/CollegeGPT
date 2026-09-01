const express = require("express");

const {
  registerUser,
} = require("../controllers/auth.controller");

const {
  loginUser,
} = require("../controllers/auth.login.controller");

const {
  googleLogin,
} = require("../controllers/google.auth.controller");

const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/password.controller");

const router = express.Router();

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginUser
);

router.post(
  "/google",
  googleLogin
);

router.post(
  "/forgot-password",
  requestPasswordReset
);

router.post(
  "/reset-password",
  resetPassword
);

module.exports = router;