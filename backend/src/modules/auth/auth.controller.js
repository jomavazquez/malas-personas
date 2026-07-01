import { registerUser, loginUser } from "./auth.service.js";

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