import { getDecks, getDeckById, getMyDecks, getDeckCards, createDeck, addCardToDeck, updateCard, deleteCard, deleteDeck, updateDeck  } from "./decks.service.js";

export const handleGetDecks = async( req, res, next ) => {
  try{
    const decks = await getDecks();
    res.json({ success: true, decks });
  }catch( err ){ 
    next(err); 
  }
};

export const handleGetDeckById = async( req, res, next ) => {
  try{
    const deck = await getDeckById(req.params.id);
    res.json({ success: true, deck });
  }catch( err ){ 
    next(err); 
  }
};

export const handleGetMyDecks = async( req, res, next ) => {
  try{
    const decks = await getMyDecks(req.user.userId);
    res.json({ success: true, decks });
  }catch( err ){ 
    next(err); 
  }
};

export const handleGetDeckCards = async( req, res, next ) => {
  try{
    const { page, type, search } = req.query;
    const result = await getDeckCards(req.user.userId, req.params.id, {
      page: page ? parseInt(page) : 1,
      type: type || null,
      search: search || null,
    });
    res.json({ success: true, ...result });
  }catch( err ){ 
    next(err); 
  }
};

export const handleCreateDeck = async( req, res, next ) => {
  try{
    const deck = await createDeck(req.user.userId, req.body);
    res.status(201).json({ success: true, deck });
  }catch( err ){ 
    next(err); 
  }
};

export const handleAddCard = async( req, res, next ) => {
  try{
    const card = await addCardToDeck(req.user.userId, req.params.id, req.body);
    res.status(201).json({ success: true, card });
  }catch( err ){ 
    next(err);
  }
};

export const handleUpdateCard = async( req, res, next ) => {
  try{
    const card = await updateCard(req.user.userId, req.params.cardId, req.body);
    res.json({ success: true, card });
  }catch( err ){ 
    next(err); 
  }
};

export const handleDeleteCard = async( req, res, next ) => {
  try{
    await deleteCard(req.user.userId, req.params.cardId);
    res.json({ success: true });
  }catch( err ){ 
    next(err); 
  }
};

export const handleDeleteDeck = async( req, res, next ) => {
  try{
    await deleteDeck(req.user.userId, req.params.id);
    res.json({ success: true });
  }catch( err ){ 
    next(err); 
  }
};

export const handleUpdateDeck = async( req, res, next ) => {
  try{
    const deck = await updateDeck(req.user.userId, req.params.id, req.body);
    res.json({ success: true, deck });
  }catch( err ){ 
    next(err); 
  }
};