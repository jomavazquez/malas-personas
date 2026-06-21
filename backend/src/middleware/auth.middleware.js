import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if( !authHeader?.startsWith("Bearer ") ){
    return res.status(401).json({ success: false, message: "TOKEN_REQUIRED" });
  }

  const token = authHeader.split(" ")[1];

  try{
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  }catch{
    return res.status(401).json({ success: false, message: "TOKEN_INVALID" });
  }
};