import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { authStorage } from "./storage";
import { users } from "@shared/models/auth";
import { db } from "../../db";

const getOidcConfig = memoize(
  async () => {
    const replId = process.env.REPL_ID;
    if (!replId) {
      throw new Error("REPL_ID is not set. Replit Auth is not available in local development mode.");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      replId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  return session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use secure cookies in production
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  return authStorage.upsertUser({
    email: claims["email"],
    password: "replit-oauth",
    firstName: claims["first_name"],
    lastName: claims["last_name"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Setup Local Strategy for email/password authentication
  passport.use(
    new LocalStrategy.Strategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await authStorage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Create user object for session
          const sessionUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          };

          return done(null, sessionUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Skip Replit Auth setup if REPL_ID is not set (local development)
  if (!process.env.REPL_ID) {
    console.log("⚠️  REPL_ID not set - running in local development mode without Replit Auth");
    console.log("   Using email/password authentication");
    
    // Signup endpoint - accepts POST with email, password, firstName, lastName
    app.post("/api/signup", async (req, res) => {
      try {
        const { email, password, firstName, lastName } = req.body;

        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user already exists
        const existingUser = await authStorage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - use direct insert instead of upsert for new signups
        let newUser;
        try {
          [newUser] = await db
            .insert(users)
            .values({
              email,
              password: hashedPassword,
              firstName: firstName || null,
              lastName: lastName || null,
            })
            .returning();
        } catch (error: any) {
          // Handle unique constraint violation (email already exists)
          if (error.code === '23505' || error.message?.includes('unique')) {
            return res.status(400).json({ message: "User with this email already exists" });
          }
          throw error; // Re-throw other errors
        }

        // Automatically log in the new user
        const sessionUser = {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        };

        req.login(sessionUser, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Account created but login failed" });
          }
          return res.json({ message: "Account created successfully", user: sessionUser });
        });
      } catch (error: any) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Failed to create account" });
      }
    });

    // Login endpoint - accepts POST with email and password
    app.post("/api/login", (req, res, next) => {
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid email or password" });
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Login failed" });
          }
          return res.json({ message: "Login successful", user });
        });
      })(req, res, next);
    });

    // Also support GET for redirect-based login (for compatibility)
    app.get("/api/login", (req, res) => {
      res.redirect("/auth");
    });
    
    // Logout endpoint
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    
    // Auth user endpoint
    app.get("/api/auth/user", (req, res) => {
      if (req.isAuthenticated() && req.user) {
        const user = req.user as any;
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    });
    
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    const dbUser = await upsertUser(tokens.claims());
    (user as any).id = dbUser.id;
    (user as any).email = dbUser.email;
    (user as any).firstName = dbUser.firstName;
    (user as any).lastName = dbUser.lastName;
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };


  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

// Check if running in local development mode (no REPL_ID)
export const isLocalDev = !process.env.REPL_ID;

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // In local dev mode, check if user is authenticated via session
  if (isLocalDev) {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
