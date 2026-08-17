// Token & user stored under 'ww_' namespace
const TOKEN_KEY = 'ww_token';
const USER_KEY  = 'ww_user';

export const getToken  = () => localStorage.getItem(TOKEN_KEY);
export const setToken  = (t) => localStorage.setItem(TOKEN_KEY, t);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};
export const setUser   = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const removeUser  = () => localStorage.removeItem(USER_KEY);

export const clearAuth = () => { removeToken(); removeUser(); };
