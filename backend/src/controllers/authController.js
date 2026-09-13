const userModel = require("../models/userModel.js");
const validate = require("../utils/validate.js");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

const cookieSecure = (() => {
  const frontendUrl = process.env.FRONTEND_URL || "";
  const isLocalFrontend =
    frontendUrl.includes("localhost") || frontendUrl.includes("127.0.0.1");
  return process.env.NODE_ENV === "production" && !isLocalFrontend;
})();

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 2 * 24 * 60 * 60 * 1000, // Updated to 2 days
};

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
};

const userReply = (user) => ({
  firstName: user.firstName,
  email: user.email,
  _id: user._id,
  role: user.role,
});

const setAuthCookie = (res, user, expiresIn) => {
  res.cookie(
    "token",
    jwt.sign(
      { _id: user._id, role: user.role, email: user.email },
      process.env.JWT_KEY,
      { expiresIn },
    ),
    AUTH_COOKIE_OPTIONS,
  );
};

const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

const frontendRedirect = (errorMessage) => {
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const url = new URL(base);
    if (errorMessage) {
      url.searchParams.set("googleAuthError", errorMessage);
    }
    return url.toString();
  } catch (err) {
    return base;
  }
};

const namesFromGoogle = (profile) => {
  let firstName = String(profile.given_name || profile.name || "").trim();
  if (!firstName) {
    firstName = String(profile.email || "user").split("@")[0];
  }
  if (firstName.length < 2) {
    firstName = `${firstName}u`;
  }
  if (firstName.length > 20) {
    firstName = firstName.slice(0, 20);
  }

  let lastName = String(profile.family_name || "").trim();
  if (lastName.length < 3 || lastName.length > 20) {
    lastName = undefined;
  }

  return { firstName, lastName };
};

const register = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: `Bad request `,
      });
    }

    validate(req.body);

    const check = await userModel.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({
        message: `User with ${req.body.email} emailId already exists , please login !`,
      });
    }

    req.body.password = await bcrypt.hash(req.body.password, 10);
    req.body.role = "user";

    const user = await userModel.create(req.body);

    // Updated expiration to '2d' (2 days)
    setAuthCookie(res, { ...user.toObject(), role: "user" }, "2d");
    const reply = userReply(user);

    return res.status(201).json({
      user: reply,
      message: "Registered Successfully",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).json({
        message: `Missing credentials !`,
      });
    }

    const user = await userModel.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(401).json({
        message: `Invalid email , please sign up`,
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: `This account uses Google sign-in`,
      });
    }

    if (!(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({
        message: `Wrong password`,
      });
    }

    // Updated expiration to '2d' (2 days)
    setAuthCookie(res, user, "2d");
    const reply = userReply(user);

    return res.status(200).json({
      user: reply,
      message: "Logged In Successfully",
    });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

const googleAuthStart = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !callbackUrl) {
      return res.status(500).json({
        message: "Google authentication is not configured",
      });
    }

    const state = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    res.cookie("google_oauth_state", state, OAUTH_COOKIE_OPTIONS);
    res.cookie("google_oauth_verifier", codeVerifier, OAUTH_COOKIE_OPTIONS);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      access_type: "online",
      prompt: "select_account",
    });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  } catch (error) {
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

const googleAuthCallback = async (req, res) => {
  const clearOauthCookies = () => {
    const clearOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    };
    res.cookie("google_oauth_state", "", clearOptions);
    res.cookie("google_oauth_verifier", "", clearOptions);
  };

  try {
    const { code, state, error } = req.query;
    const expectedState = req.cookies.google_oauth_state;
    const codeVerifier = req.cookies.google_oauth_verifier;

    clearOauthCookies();

    if (error) {
      return res.redirect(
        frontendRedirect("Google authentication was cancelled"),
      );
    }

    if (
      !code ||
      !state ||
      !expectedState ||
      !codeVerifier ||
      !safeEqual(state, expectedState)
    ) {
      return res.redirect(
        frontendRedirect("Invalid Google authentication request"),
      );
    }

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const accessToken = tokenResponse.data && tokenResponse.data.access_token;
    if (!accessToken) {
      return res.redirect(frontendRedirect("Could not verify Google account"));
    }

    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const profile = userInfoResponse.data || {};
    const googleId = profile.sub;
    const email = profile.email && String(profile.email).toLowerCase().trim();

    if (!googleId || !email || profile.email_verified === false) {
      return res.redirect(
        frontendRedirect("Google account email is not verified"),
      );
    }

    let user = await userModel.findOne({ googleId });

    if (!user) {
      const existingByEmail = await userModel.findOne({ email });

      if (existingByEmail) {
        if (existingByEmail.googleId && existingByEmail.googleId !== googleId) {
          return res.redirect(
            frontendRedirect("This email is already linked to another account"),
          );
        }

        if (!existingByEmail.googleId) {
          existingByEmail.googleId = googleId;
          await existingByEmail.save();
        }

        user = existingByEmail;
      } else {
        const { firstName, lastName } = namesFromGoogle(profile);
        user = await userModel.create({
          firstName,
          lastName,
          email,
          googleId,
          role: "user",
        });
      }
    }

    if (!user) {
      return res.redirect(frontendRedirect("Google authentication failed"));
    }

    // Updated expiration to '2d' (2 days)
    setAuthCookie(res, user, "2d");
    return res.redirect(frontendRedirect());
  } catch (error) {
    const googleError =
      error.response && error.response.data && error.response.data.error;
    if (googleError === "redirect_uri_mismatch") {
      return res.redirect(
        frontendRedirect("Google login is misconfigured. Please try again later"),
      );
    }
    return res.redirect(frontendRedirect("Google authentication failed"));
  }
};

module.exports = {
  register,
  login,
  logout,
  googleAuthStart,
  googleAuthCallback,
};
