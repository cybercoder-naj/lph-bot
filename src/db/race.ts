import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { championship } from "./championship";
import { Race } from "../types";
import { Database } from ".";
import { isEqual } from "lodash";
import { eq, gt, lt } from "drizzle-orm";
import { SyncResults } from "../simgrid/utils";

export const race = sqliteTable('race', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  date: text().notNull(),
  track: text().notNull(),
  imageLink: text(),
  championshipId: integer().notNull().references(() => championship.id),
});

export async function syncRaces(db: Database, races: Race[]): Promise<SyncResults<Race>> {
  const now = new Date().toISOString();

  const newRaces: Race[] = [];
  const updatedRaces: Race[] = [];
  let archivedRaces: Race[] = [];

  await db.transaction(async (tx) => {
    const existingRaces = await tx.select().from(race).where(gt(race.date, now));
    const existingMap = new Map(existingRaces.map(er => [er.id, er]));

    for (const r of races) {
      if (!r.id) {
        await tx.insert(race).values(r);
        newRaces.push(r);
        continue;
      }

      const current = existingMap.get(r.id);
      if (!isEqual(current, r)) {
        await tx.update(race).set(r).where(eq(race.id, r.id));
        updatedRaces.push(r);
      }
    }

    const past = await tx.select().from(race).where(lt(race.date, now));
    archivedRaces = past;
  });

  return { inserted: newRaces, updated: updatedRaces, archived: archivedRaces };
}