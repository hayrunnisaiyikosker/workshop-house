import { query } from '../db/pool.js';
import type { UserPreferences } from './auth.js';
import type { PreferencesInput } from '../validation/preferences.js';

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const result = await query<{
    text_scale: '100' | '125' | '150';
    high_contrast: boolean;
    reduced_motion: boolean;
    shortcuts_enabled: boolean;
  }>(
    'SELECT text_scale, high_contrast, reduced_motion, shortcuts_enabled FROM user_preferences WHERE user_id = $1',
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    return {
      text_scale: '100',
      high_contrast: false,
      reduced_motion: false,
      shortcuts_enabled: true,
    };
  }

  return row;
}

export async function updateUserPreferences(
  userId: string,
  data: PreferencesInput
): Promise<UserPreferences> {
  await query(
    `INSERT INTO user_preferences (user_id, text_scale, high_contrast, reduced_motion, shortcuts_enabled)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id)
     DO UPDATE SET 
       text_scale = EXCLUDED.text_scale,
       high_contrast = EXCLUDED.high_contrast,
       reduced_motion = EXCLUDED.reduced_motion,
       shortcuts_enabled = EXCLUDED.shortcuts_enabled`,
    [userId, data.text_scale, data.high_contrast, data.reduced_motion, data.shortcuts_enabled]
  );

  return {
    text_scale: data.text_scale,
    high_contrast: data.high_contrast,
    reduced_motion: data.reduced_motion,
    shortcuts_enabled: data.shortcuts_enabled,
  };
}
