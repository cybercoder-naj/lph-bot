import { drizzle } from "drizzle-orm/d1";

export function makeDb(db: D1Database) {
  return drizzle(db);
}

export type Database = ReturnType<typeof makeDb>;

export { insertChampionship } from './championship';
export { syncRaces } from './race';