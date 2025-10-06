import jwt from "jsonwebtoken";
import { config } from "dotenv";

config()

const ACCESS_TOKEN_SECRET = process.env["ACCESS_TOKEN_SECRET"];
const REFRESH_TOKEN_SECRET = process.env["REFRESH_TOKEN_SECRET"];

function generateAccessToken(payload: jwt.JwtPayload) { 
 if(!ACCESS_TOKEN_SECRET) throw new Error("there is not acess token secret found");

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(payload: jwt.JwtPayload) {
 if(!REFRESH_TOKEN_SECRET) throw new Error("there is not refresh token secret found");
 
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}






export {generateAccessToken, generateRefreshToken}

