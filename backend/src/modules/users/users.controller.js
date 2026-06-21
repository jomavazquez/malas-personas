import { getMe, updateMe } from "./users.service.js";

export const handleGetMe = async (req, res, next) => {
  try {
    const user = await getMe(req.user.userId);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const handleUpdateMe = async (req, res, next) => {
  try {
    const user = await updateMe(req.user.userId, req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
