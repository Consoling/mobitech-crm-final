import jwt from 'jsonwebtoken'
import { SYS_ENV } from './env.js'
import crypto from "crypto";

export const generateAccessToken = (payload: any) => {
    const accessToken = jwt.sign(payload, SYS_ENV.ACCESS_TOKEN_SECRET!, {
        expiresIn: "15m"
    })
    return accessToken;
}
export const generateRefreshToken = (payload: any) => {
     const refreshToken = jwt.sign(payload, SYS_ENV.REFRESH_TOKEN_SECRET!, {
        expiresIn: "30d"
    })
    return refreshToken;
}


export const hashToken = (token: any) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
