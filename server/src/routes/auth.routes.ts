import express, { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {config} from "dotenv";
import { 
  generateAccessToken, 
  generateRefreshToken, 
} from "../utils/jwt.utils.ts";
import {
  saveRefreshToken, 
  getSavedHashedRefreshToken, 
  deleteSavedRefreshToken, 
  hashToken 
} from "../services/auth.services.ts"
import { supabase } from "../config/db";

config();

const router:Router = express.Router();

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body ;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    // ensure not already exists
    const { data: existing, error: lookupErr } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (lookupErr) throw lookupErr;
    if (existing) return res.status(400).json({ error: 'user with this email already exists' });

    const pwHash = await bcrypt.hash(password, 10);
    const { data: newUser, error: insertErr } = await supabase.from('users').insert([{ email, password: pwHash, name, role }]).select('id, email, name, role').single();
    if (insertErr) throw insertErr;

    const userId = newUser.id;
    const accessToken = generateAccessToken({ sub: userId, email: newUser.email, role: newUser.role });
    const refreshToken = generateRefreshToken({ sub: userId });
    await saveRefreshToken(userId, refreshToken);

    return res.status(201).json({ accessToken, refreshToken });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to signup' });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'email+password required' });

    const { data: user, error } = await supabase.from('users').select('id, email, password, role, name').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ sub: user.id });
    await saveRefreshToken(user.id, refreshToken);
    res.json({ accessToken, refreshToken, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to login' });
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  if (!REFRESH_TOKEN_SECRET) {
    return res.status(500).json({ error: "Server misconfiguration: missing refresh token secret" });
  }

  
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err: any, payload: any) => {
    if (err) return res.status(401).json({ error: "invalid refresh token" });
    const userId = payload.sub;
    if (!userId) return res.status(401).json({ error: "invalid token payload" });

    const savedHashed = await getSavedHashedRefreshToken(userId);
    const incomingHash = hashToken(refreshToken);

    if (!savedHashed || savedHashed !== incomingHash) {
      await deleteSavedRefreshToken(userId);
      return res.status(401).json({ error: "refresh token reused or revoked" });
    }

    const newAccessToken = generateAccessToken({ sub: userId });
    const newRefreshToken = generateRefreshToken({ sub: userId });

    await saveRefreshToken(userId, newRefreshToken);

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  });
});

router.post("/logout", async (req, res) => {
  const { userId } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: "userId required" });

  await deleteSavedRefreshToken(userId);
  return res.json({ ok: true });
});




export default router