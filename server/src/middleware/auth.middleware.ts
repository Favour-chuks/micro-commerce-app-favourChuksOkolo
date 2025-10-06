import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from 'express';
import { supabase } from "../config/db";
import {config} from 'dotenv';

config();

const ACCESS_TOKEN_SECRET = process.env["ACCESS_TOKEN_SECRET"] || "access-secret-demo";

// ---------- Auth Middleware ----------
export default function authenticateAccessToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) return res.status(401).json({ error: "no token" });

  try {
    const payload = jwt.verify(token as string, ACCESS_TOKEN_SECRET) as any;
    // standardize user payload shape: prefer sub then id
    (req as any).user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

// role authorization middleware generator
export function authorizeRole(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'unauthenticated' });

    // fast path: token contains role
    if (user.role && user.role === requiredRole) return next();

    // fallback: look up user's role in DB
    const userId = user.sub || user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
    if (error || !data) return res.status(403).json({ error: 'forbidden' });
    if (data.role !== requiredRole) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}