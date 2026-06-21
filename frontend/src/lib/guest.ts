export const getOrCreateGuestId = (): string => {
  const existing = localStorage.getItem("guestId");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("guestId", id);
  return id;
};

export const clearGuestId = (): void => {
  localStorage.removeItem("guestId");
};