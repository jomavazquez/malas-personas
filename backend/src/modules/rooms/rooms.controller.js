import { createRoom, getRoomByCode, closeRoom } from "./rooms.service.js";

export const handleCreateRoom = async (req, res, next) => {
  try {
    const room = await createRoom(req.user.userId, req.body);
    res.status(201).json({ success: true, room });
  } catch (err) {
    next(err);
  }
};

export const handleGetRoom = async (req, res, next) => {
  try {
    const room = await getRoomByCode(req.params.code);
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
};

export const handleCloseRoom = async (req, res, next) => {
  try {
    const room = await closeRoom(req.user.userId, req.params.code);
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
};
