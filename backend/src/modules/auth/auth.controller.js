import { registerUser, loginUser, requestPasswordReset, verifyResetCode, resetPassword } from "./auth.service.js";
import { sendResetCodeEmail } from "./reset.email.js";

export const register = async( req, res, next ) => {
  try{
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ success: true, user, token });
  }catch( err ){
    next(err);
  }
};

export const login = async( req, res, next ) => {
  try{
    const { user, token } = await loginUser(req.body);
    res.json({ success: true, user, token });
  }catch( err ){
    next(err);
  }
};
export const forgotPassword = async( req, res, next ) => {
  try{
    const { email, lang } = req.body;
    if( !email ) return res.status(400).json({ success: false, message: "MISSING_EMAIL" });
    const { code, username } = await requestPasswordReset(email);
    await sendResetCodeEmail({ email, username, code, lang: lang ?? "es" });
    res.json({ success: true });
  }catch( err ){
    next(err);
  }
};

export const verifyCode = async( req, res, next ) => {
  try{
    const { email, code } = req.body;
    verifyResetCode(email, code);
    res.json({ success: true });
  }catch( err ){
    next(err);
  }
};

export const handleResetPassword = async( req, res, next ) => {
  try{
    const { email, code, password } = req.body;
    await resetPassword(email, code, password);
    res.json({ success: true });
  }catch( err ){
    next(err);
  }
};