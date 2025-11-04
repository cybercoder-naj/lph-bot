import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { Championship } from '../types';
import { Database } from '.';

export const championship = sqliteTable('championship', {
  id: integer(),
  name: text(),
  community: text(),
  image: text(),
  game: text(),
  registration: text(),
  dates: text(),
  rounds: text()
});

export async function upsertChampionship(db: Database, c: Championship) {
  await db.insert(championship).values(c).onConflictDoUpdate({
    target: championship.id,
    set: c
  });
}