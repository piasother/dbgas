// Email + password authentication (replaces Replit Auth so the site can run
// on any host: Afrihost, Render, a VPS, etc.).
//
// It keeps the same contract the rest of the app was written against:
//   - setupAuth(app) and isAuthenticated middleware
//   - req.user.claims.sub   -> the user's id
//   - req.user.claims.email -> the user's email
// so routes.ts and the admin check work unchanged.
//
// Environment variables:
//   SESSION_SECRET  (required in production) long random string for signing cookies
//   ADMIN_EMAIL     (optional) defaults to andrewsbulle@gmail.com
//   ADMIN_PASSWORD  (optional) if set, the admin account is created / its password
//                   is set to this value every time the app starts
import crypto from "crypto";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request, RequestHandler } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, pool } from "./db";
import { users, type User } from "@shared/schema";
import { sendMail } from "./mailer";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "andrewsbulle@gmail.com").trim().toLowerCase();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const BCRYPT_ROUNDS = 12;

type SessionUser = {
  id: string;
  role: string;
  claims: {
    sub: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

export const ROLES = ["user", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** The owner account (ADMIN_EMAIL) is always admin, whatever the database says. */
export function isOwnerEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase() === ADMIN_EMAIL;
}

export function effectiveRole(user: Pick<User, "role" | "email">): Role {
  if (isOwnerEmail(user.email)) return "admin";
  return user.role === "admin" || user.role === "staff" ? user.role : "user";
}

/** Strip secrets before sending a user record to the browser. */
export function toPublicUser(user: User) {
  const { passwordHash: _p, resetTokenHash: _t, resetTokenExpiresAt: _e, ...rest } = user;
  return { ...rest, role: effectiveRole(user), isOwner: isOwnerEmail(user.email) };
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    role: effectiveRole(user),
    claims: {
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
    },
  };
}

async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

async function findUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

function getSession() {
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set (a long random string).");
    }
    secret = crypto.randomBytes(32).toString("hex");
    console.warn("SESSION_SECRET not set; using a temporary one (sessions reset on restart).");
  }

  const PgStore = connectPg(session);
  return session({
    secret,
    store: new PgStore({
      // Reuse the app's own database pool. On Neon this connects over HTTPS/WebSockets
      // (port 443); a separate conString connection would use port 5432, which shared
      // hosts such as Afrihost often block - that made logins hang.
      pool: pool as any,
      // The sessions table is created by the database setup script / drizzle-kit push.
      createTableIfMissing: false,
      ttl: SESSION_TTL_MS / 1000,
      tableName: "sessions",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // "auto" = secure cookie when the request arrived over HTTPS
      // (works behind Afrihost/Render proxies thanks to trust proxy).
      secure: "auto",
      maxAge: SESSION_TTL_MS,
    },
  });
}

/** Create the admin account, or reset its password, from ADMIN_PASSWORD. */
async function ensureAdminAccount() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  if (password.length < 8) {
    console.warn("ADMIN_PASSWORD is shorter than 8 characters; admin account not updated.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, role: "admin", status: "active", updatedAt: new Date() })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: ADMIN_EMAIL,
      firstName: "Admin",
      passwordHash,
      role: "admin",
      status: "active",
    });
  }
  console.log(`Admin account ready for ${ADMIN_EMAIL}`);
}

// Very small in-memory brute-force guard: 10 failed logins per 15 min per IP+email.
const failedLogins = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function loginKey(req: Request, email: string) {
  return `${req.ip}|${email}`;
}
function isLockedOut(key: string) {
  const entry = failedLogins.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedLogins.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILS;
}
function recordFailure(key: string) {
  const entry = failedLogins.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    failedLogins.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count++;
  }
}

/** Only allow redirects back into this site. */
function safeReturnTo(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) return "/";
  return value;
}

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await findUserByEmail(email.trim().toLowerCase());
        if (!user || !user.passwordHash) return done(null, false);
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return done(null, false);
        if (user.status && user.status !== "active") return done(null, false);
        return done(null, toSessionUser(user));
      } catch (err) {
        return done(err);
      }
    }),
  );

  // Only the user id lives in the session; the record is re-read each request
  // so suspending a user takes effect immediately.
  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await findUserById(id);
      if (!user || (user.status && user.status !== "active")) return cb(null, false);
      cb(null, toSessionUser(user));
    } catch (err) {
      cb(err);
    }
  });

  // Self-migration: add the password-reset columns if this database predates them.
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash varchar`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp`);

  await ensureAdminAccount();

  // Old Replit-style links still used by the frontend buttons.
  app.get("/api/login", (req, res) => {
    let returnTo = safeReturnTo(req.query.returnTo);
    if (returnTo === "/" && req.get("referer")) {
      try {
        const ref = new URL(req.get("referer")!);
        if (ref.host === req.get("host")) returnTo = safeReturnTo(ref.pathname + ref.search);
      } catch {
        /* ignore bad referer */
      }
    }
    if (returnTo.startsWith("/login")) returnTo = "/";
    res.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  });

  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => res.redirect("/"));
    });
  });

  app.post("/api/auth/register", async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid details" });
    }
    const { email, password, firstName, lastName } = parsed.data;

    if (email === ADMIN_EMAIL) {
      return res.status(400).json({ message: "This email can't be registered here." });
    }

    try {
      if (await findUserByEmail(email)) {
        return res.status(409).json({ message: "An account with this email already exists. Please log in." });
      }
      const [user] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
          role: "user",
          status: "active",
        })
        .returning();

      req.login(toSessionUser(user), (err) => {
        if (err) return next(err);
        res.status(201).json(toPublicUser(user));
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Enter your email and password." });
    }
    req.body.email = parsed.data.email;
    const key = loginKey(req, parsed.data.email);
    if (isLockedOut(key)) {
      return res.status(429).json({ message: "Too many attempts. Try again in 15 minutes." });
    }

    passport.authenticate("local", (err: any, user: SessionUser | false) => {
      if (err) return next(err);
      if (!user) {
        recordFailure(key);
        return res.status(401).json({ message: "Incorrect email or password." });
      }
      failedLogins.delete(key);
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        const record = await findUserById(user.id);
        res.json(record ? toPublicUser(record) : user.claims);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => res.json({ ok: true }));
    });
  });

  // ---- Password reset -------------------------------------------------------
  const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
  const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

  app.post("/api/auth/forgot-password", async (req, res) => {
    const generic = { message: "If an account exists for that email, we've sent a link to reset the password." };
    const parsed = z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid email address." });
    const email = parsed.data.email;

    const key = `reset|${req.ip}|${email}`;
    if (isLockedOut(key)) return res.json(generic);
    recordFailure(key); // counts requests, so one address can't be spammed

    try {
      const user = await findUserByEmail(email);
      if (user && (!user.status || user.status === "active")) {
        const token = crypto.randomBytes(32).toString("hex");
        await db
          .update(users)
          .set({ resetTokenHash: hashToken(token), resetTokenExpiresAt: new Date(Date.now() + RESET_TTL_MS) })
          .where(eq(users.id, user.id));

        const link = `${req.protocol}://${req.get("host")}/reset-password?token=${token}`;
        const name = user.firstName ? ` ${user.firstName}` : "";
        await sendMail(
          email,
          "Reset your DB Gas password",
          `Hi${name},\n\nWe received a request to reset the password for your DB Gas account.\n\n` +
            `Reset it here (link valid for 1 hour):\n${link}\n\n` +
            `If you didn't ask for this, you can ignore this email - your password won't change.\n\nDB Gas`,
          `<p>Hi${name},</p><p>We received a request to reset the password for your DB Gas account.</p>` +
            `<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#ff6b35;color:#fff;border-radius:6px;text-decoration:none">Reset my password</a></p>` +
            `<p>This link is valid for 1 hour. If you didn't ask for this, you can ignore this email.</p><p>DB Gas</p>`,
        );
      }
    } catch (err) {
      console.error("Forgot-password error:", err);
    }
    res.json(generic);
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    const parsed = z
      .object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
        password: z.string().min(8, "Password must be at least 8 characters").max(200),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.find((e) => e.path[0] === "password")?.message;
      return res.status(400).json({ message: msg || "This reset link is invalid. Please request a new one." });
    }
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.resetTokenHash, hashToken(parsed.data.token)), gt(users.resetTokenExpiresAt, new Date())));
      if (!user) {
        return res.status(400).json({ message: "This reset link has expired or was already used. Please request a new one." });
      }
      if ((user.email || "").toLowerCase() === ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        return res.status(400).json({
          message: "The admin password is set in cPanel (ADMIN_PASSWORD). Change it there and restart the app.",
        });
      }
      await db
        .update(users)
        .set({
          passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS),
          resetTokenHash: null,
          resetTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      req.login(toSessionUser({ ...user, resetTokenHash: null }), (err) => {
        if (err) return next(err);
        res.json({ message: "Your password has been changed." });
      });
    } catch (err) {
      next(err);
    }
  });
}


export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

/** Admin = users.role "admin", or the ADMIN_EMAIL account. */
export const isAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if ((req.user as any).role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
};

/** Staff = can run orders, deliveries and stock. Admins can do this too. */
export const isStaff: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const role = (req.user as any).role;
  if (role !== "admin" && role !== "staff") return res.status(403).json({ message: "Staff access required" });
  next();
};
