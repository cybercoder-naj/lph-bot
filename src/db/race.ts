import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { championship } from "./championship";
import { Race } from "../types";
import { Database } from ".";
import { isEqual } from "lodash";
import { eq, gt, lt, sql } from "drizzle-orm";
import { SyncResults } from "../simgrid/utils";

export const race = sqliteTable('race', {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  name: text().notNull(),
  date: text().notNull(),
  track: text().notNull(),
  imageLink: text(),
  championshipId: integer().notNull().references(() => championship.id),
});

export async function syncRaces(db: Database, races: Race[]): Promise<SyncResults<Race>> {
  if (races.length === 0) return { inserted: [], updated: [], archived: [] };

  console.log(`Syncing ${races.length} races, eg.`, races[0]);

  const now = new Date().toISOString();

  const newRaces: Race[] = [];
  const updatedRaces: Race[] = [];
  let archivedRaces: Race[] = [];

  const allRaces = await db.select().from(race);
  const existingRaces = allRaces.filter(r => r.date >= now);
  const existingMap = new Map(existingRaces.map(er => [er.id, er]));

  for (const r of races) {
    if (!r.id) {
      await db.run(sql`INSERT INTO ${race} (name, date, track, championshipId) VALUES (${r.name}, ${r.date}, ${r.track}, ${r.championshipId})`);
      newRaces.push(r);
      continue;
    }

    const current = existingMap.get(r.id);
    if (!isEqual(current, r)) {
      await db.update(race).set(r).where(eq(race.id, r.id));
      updatedRaces.push(r);
    }
  }

  const past = allRaces.filter(r => r.date < now);
  archivedRaces = past;

  return { inserted: newRaces, updated: updatedRaces, archived: archivedRaces };
}