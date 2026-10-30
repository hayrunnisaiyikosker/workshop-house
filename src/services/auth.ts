import argon2 from 'argon2';
import { query } from '../db/pool.js';
import type { LoginInput } from '../validation/auth.js';

export type UserRole = 'learner' | 'trainer' | 'coordinator';

export interface UserPreferences {
  text_scale: '100' | '125' | '150';
  high_contrast: boolean;
  reduced_motion: boolean;
  shortcuts_enabled: boolean;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences?: UserPreferences;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

interface PreferencesRow {
  user_id: string;
  text_scale: '100' | '125' | '150';
  high_contrast: boolean;
  reduced_motion: boolean;
  shortcuts_enabled: boolean;
}

export async function authenticateUser(input: LoginInput): Promise<AuthenticatedUser | null> {
  const result = await query<UserRow>(
    'SELECT id, name, email, password_hash, role, created_at FROM users WHERE LOWER(email) = LOWER($1)',
    [input.email]
  );

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  const isPasswordValid = await argon2.verify(user.password_hash, input.password);
  if (!isPasswordValid) {
    return null;
  }

  const prefResult = await query<PreferencesRow>(
    'SELECT text_scale, high_contrast, reduced_motion, shortcuts_enabled FROM user_preferences WHERE user_id = $1',
    [user.id]
  );

  const prefRow = prefResult.rows[0];
  const preferences: UserPreferences = prefRow
    ? {
        text_scale: prefRow.text_scale,
        high_contrast: prefRow.high_contrast,
        reduced_motion: prefRow.reduced_motion,
        shortcuts_enabled: prefRow.shortcuts_enabled,
      }
    : {
        text_scale: '100',
        high_contrast: false,
        reduced_motion: false,
        shortcuts_enabled: true,
      };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferences,
  };
}

export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const result = await query<UserRow>(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [id]
  );

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  const prefResult = await query<PreferencesRow>(
    'SELECT text_scale, high_contrast, reduced_motion, shortcuts_enabled FROM user_preferences WHERE user_id = $1',
    [user.id]
  );

  const prefRow = prefResult.rows[0];
  const preferences: UserPreferences = prefRow
    ? {
        text_scale: prefRow.text_scale,
        high_contrast: prefRow.high_contrast,
        reduced_motion: prefRow.reduced_motion,
        shortcuts_enabled: prefRow.shortcuts_enabled,
      }
    : {
        text_scale: '100',
        high_contrast: false,
        reduced_motion: false,
        shortcuts_enabled: true,
      };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferences,
  };
}
