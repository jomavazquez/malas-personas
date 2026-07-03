// In-memory store: Map<email, { code, expiresAt }>
const resetCodes = new Map();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const saveCode = ( email, code ) => {
    resetCodes.set(email.toLowerCase(), {
        code,
        expiresAt: Date.now() + CODE_TTL_MS,
    });
};

export const verifyCode = ( email, code ) => {
    const entry = resetCodes.get(email.toLowerCase());
    if( !entry ) return false;
    if( Date.now() > entry.expiresAt ){
        resetCodes.delete(email.toLowerCase());
        return false;
    }
    return entry.code === code;
};

export const deleteCode = ( email ) => {
    resetCodes.delete(email.toLowerCase());
};