import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { Championship } from '../types';
import { Database } from '.';

export const championship = sqliteTable('championship', {
  id: integer().unique(),
  name: text(),
  community: text(),
  image: text(),
  game: text(),
  registration: text(),
  dates: text(),
  rounds: text()
});

export async function insertChampionship(db: Database, cs: Championship[]) {
  console.log(`Inserting ${cs.length} championships`);
  if (cs.length === 0) return;

  // @ts-ignore cs.length > 0
  await db.batch(cs.map(c => db.insert(championship).values(c)));
}
