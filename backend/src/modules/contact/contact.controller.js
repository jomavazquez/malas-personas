import { sendContactEmail } from "./contact.service.js";

export const handleContact = async( req, res, next ) => {
  try{
    const { name, email, subject, message } = req.body;
    
    if( !name || !email || !subject || !message ){
      return res.status(400).json({ success: false, message: "MISSING_FIELDS" });
    }
    await sendContactEmail({ name, email, subject, message });
    res.json({ success: true });
  }catch( err ){
    next(err);
  }
};