import { pool } from './db';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

export async function createSession(userId: string): Promise<string> {
  const token = uuidv4();
  const expires = addDays(new Date(), 7);
  
  await pool.query(
    'INSERT INTO sessions (user_id, token, expires, created_at) VALUES ($1, $2, $3, NOW())',
    [userId, token, expires]
  );
  
  return token;
}

export async function getSession(token: string): Promise<any> {
  const result = await pool.query(
    'SELECT s.*, u.* FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires > NOW() LIMIT 1',
    [token]
  );
  return result.rows[0];
}

export async function deleteSession(token: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
}

export async function deleteExpiredSessions(): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE expires < NOW()');
} 