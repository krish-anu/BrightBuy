const jwt = require('jsonwebtoken');

// Simple in-memory blacklist. token -> expiry (ms)
const blacklist = new Map();

function addToken(token) {
  if (!token) return;
  try {
    const decoded = jwt.decode(token);
    const expMs = decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 60 * 60 * 1000;
    blacklist.set(token, expMs);
  } catch (err) {
    // fallback
    blacklist.set(token, Date.now() + 60 * 60 * 1000);
  }
}

function isBlacklisted(token) {
  if (!token) return false;
  const exp = blacklist.get(token);
  if (!exp) return false;
  if (Date.now() >= exp) {
    blacklist.delete(token);
    return false;
  }
  return true;
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of blacklist.entries()) {
    if (exp <= now) blacklist.delete(t);
  }
}, 60 * 60 * 1000);

module.exports = { addToken, isBlacklisted };
