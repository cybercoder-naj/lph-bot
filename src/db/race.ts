import { isEqual } from "lodash";
import { SyncResults } from "../simgrid/utils";
import { Championship } from "./championship";

export type Race = {
  id?: number; // Auto-incremented ID
  name: string;
  date: string;
  track: string;
  imageLink: string | null;

  // Foreign key reference
  championship: Championship;
}

// Exported for testing
export function partitionRaces(races: Race[], racesInDB: Race[]): SyncResults<Race> {
  const now = new Date().toISOString();
  const dbRaceMap = new Map(racesInDB.map(r => [r.id, r]));

  return { 
    inserted: races.filter(r => !dbRaceMap.has(r.id) && r.date > now),
    updated: races.filter(r => dbRaceMap.has(r.id) && !isEqual(dbRaceMap.get(r.id), r)),
    archived: racesInDB.filter(r => r.date < now) 
  };
}

export async function syncRaces(db: D1Database, races: Race[]): Promise<SyncResults<Race>> {
  if (races.length === 0) return { inserted: [], updated: [], archived: [] };

  console.log(`Syncing ${races.length} races, eg.`, races[0]);

  const selectRacesResult = await db.prepare(`SELECT * FROM race`).all();
  if (!selectRacesResult.success) {
    console.error("Error fetching existing races:", selectRacesResult.error);
    return { inserted: [], updated: [], archived: [] };
  }
  const racesInDB = selectRacesResult.results as Race[];

  const syncResult = partitionRaces(races, racesInDB);

  if (syncResult.inserted.length > 0) {
    const insertRaceStmt = db.prepare(
      `INSERT INTO race (name, date, track, imageLink, championshipId) VALUES (?, ?, ?, ?, ?)`
    );
    const batchResult = await db.batch(syncResult.inserted.map(r => 
      insertRaceStmt.bind(
        r.name,
        r.date,
        r.track,
        r.imageLink,
        r.championship.id
      )
    ));
    if (batchResult.some(r => !r.success)) {
      console.error("Error inserting new races");
      throw new Error("Failed to insert some races");
    }
  }

  if (syncResult.updated.length > 0) {
    const updateRaceStmt = db.prepare(
      `UPDATE race SET name = ?, date = ?, track = ?, imageLink = ?, championshipId = ? WHERE id = ?`
    );
    const batchResult = await db.batch(syncResult.updated.map(r => 
      updateRaceStmt.bind(
        r.name,
        r.date,
        r.track,
        r.imageLink,
        r.championship.id,
        r.id
      )
    ));
    if (batchResult.some(r => !r.success)) {
      console.error("Error updating races");
      throw new Error("Failed to update some races");
    }
  }

  return syncResult;
}