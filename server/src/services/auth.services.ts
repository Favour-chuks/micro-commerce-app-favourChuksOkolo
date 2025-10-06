import { supabase } from "../config/db";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";

config();
const REFRESH_TOKEN_SECRET = process.env["REFRESH_TOKEN_SECRET"];

async function saveRefreshToken(userId: string, refreshToken: string) {
  const hashed = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + msToSec(jwtDecodeExpiryMs(refreshToken) - Date.now()) * 1000);

  const { data, error } = await supabase
    .from("refresh_tokens")
    .upsert([
      {
        user_id: userId,
        token_hash: hashed,
        expires_at: expiresAt.toISOString(),
      },
    ], { onConflict: "user_id" });

  if (error) throw error;
  return data;
}


async function getSavedHashedRefreshToken(userId: string) {
 const { data, error } = await supabase
  .from('refresh_token')
  .select('*')
  .eq('id', userId)
  .single();
 if (error) throw error;

 // TODO: dont forget to remove this
 console.log(data)
 return data;
}

async function deleteSavedRefreshToken(userId: string) {
 const { data, error } = await supabase
  .from('token')
  .delete()
  .eq('id', userId);
 if (error) throw error;
 return data;
}


// utility: convert ms to seconds
function msToSec(ms: number) {
  return Math.max(Math.floor(ms / 1000), 1);
}


// get expiry (ms since epoch) from JWT without verifying signature (we just need exp)
function jwtDecodeExpiryMs(token: string) {
  try {
    const decoded = jwt.decode(token) as any;
    // exp is in seconds since epoch
    if (decoded && decoded.exp) return decoded.exp * 1000;
    return Date.now();
  } catch {
    return Date.now();
  }
}

// Hash refresh token before storing so stored token cannot be reused if DB is leaked
function hashToken(token: string) {
  if(!REFRESH_TOKEN_SECRET) throw new Error("Refresh token secret not found");

  return crypto.createHmac("sha256", REFRESH_TOKEN_SECRET).update(token).digest("hex");
}



export { saveRefreshToken, 
  getSavedHashedRefreshToken, 
  deleteSavedRefreshToken, 
  hashToken }

