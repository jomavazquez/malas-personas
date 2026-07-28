import { getRandomPrompt } from "./v_o_m.service.js";

export const handleGetRandomPrompt = async( req, res, next ) => {
  try{
    const prompt = await getRandomPrompt(req.query.language);
    res.json({ success: true, prompt });
  }catch( err ){
    next(err);
  }
};