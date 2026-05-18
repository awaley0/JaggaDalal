import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract role from cookies (set when user initiates Google auth)
        const requestedRole = req.cookies?.oauthRole || "buyer";
        const normalizedRole = ["buyer", "seller"].includes(requestedRole) ? requestedRole : "buyer";

        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Create new user with the requested role
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "OAUTH_PASSWORD",
            role: normalizedRole,
            requestedRole: normalizedRole === "seller" ? "seller" : null,
            roleRequestStatus: normalizedRole === "seller" ? "pending" : "approved",
            verified: true,
            googleId: profile.id,
            googleProfile: {
              picture: profile.photos[0]?.value,
              locale: profile._json.locale,
            },
            lastLogin: new Date(),
          });
          console.log(`✅ New user created via Google: ${user.email} as ${normalizedRole}`);
        } else {
          // Update existing user with google info and potentially new role
          if (!user.googleId) {
            user.googleId = profile.id;
            user.googleProfile = {
              picture: profile.photos[0]?.value,
              locale: profile._json.locale,
            };
          }
          
          // Update role if user is trying to login as different role
          if (normalizedRole === "seller" && user.role !== "seller") {
            user.role = "seller";
            user.requestedRole = "seller";
            user.roleRequestStatus = user.roleRequestStatus === "approved" ? "pending" : user.roleRequestStatus;
            console.log(`⚠️ User ${user.email} switched to seller role`);
          } else if (normalizedRole === "buyer" && user.role !== "buyer") {
            user.role = "buyer";
            user.requestedRole = null;
            user.roleRequestStatus = "approved";
            console.log(`⚠️ User ${user.email} switched to buyer role`);
          }
          
          user.lastLogin = new Date();
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("❌ Google Strategy Error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
