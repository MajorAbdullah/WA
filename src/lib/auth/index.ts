/**
 * Authentication Utilities
 * Main auth functions for login, logout, and session management
 */

import bcrypt from 'bcryptjs';
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  verifySession,
} from './session';

export { getSession, verifySession } from './session';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface User {
  username: string;
}

/**
 * Authenticate user with credentials
 */
export async function authenticate(
  username: string,
  password: string
): Promise<AuthResult> {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set');
    return { success: false, error: 'Server configuration error' };
  }

  // Check username
  if (username !== adminUsername) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Check password - support both plain and hashed passwords
  let passwordValid = false;

  // If password starts with $2a$ or $2b$, it's a bcrypt hash
  if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
    passwordValid = await bcrypt.compare(password, adminPassword);
  } else {
    // Plain text comparison (for development)
    passwordValid = password === adminPassword;
  }

  if (!passwordValid) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Create and set session
  const token = await createSession(username);
  await setSessionCookie(token);

  return { success: true };
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  await clearSessionCookie();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  return {
    username: session.username,
  };
}
