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

export async function syncRaces(db: D1Database, races: Race[]): Promise<SyncResults<Race>> {
  if (races.length === 0) return { inserted: [], updated: [], archived: [] };

  console.log(`Syncing ${races.length} races, eg.`, races[0]);

  const now = new Date().toISOString();

  const selectRacesResult = await db.prepare(`SELECT * FROM race`).all();
  if (!selectRacesResult.success) {
    console.error("Error fetching existing races:", selectRacesResult.error);
    return { inserted: [], updated: [], archived: [] };
  }
  const racesInDB = selectRacesResult.results as Race[];

  const newRaces = races.filter(r => !r.id || !racesInDB.some(er => er.id === r.id));
  if (newRaces.length > 0) {
    const insertRaceStmt = db.prepare(
      `INSERT INTO race (name, date, track, imageLink, championshipId) VALUES (?, ?, ?, ?, ?)`
    );
    const batchResult = await db.batch(newRaces.map(r => 
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

  let existingRaces = races.filter(r => racesInDB.some(nr => nr.id === r.id));
  
  // check for updates
  const updatedRaces = existingRaces.filter(r => {
    const dbRace = racesInDB.find(er => er.id === r.id);
    return dbRace && !isEqual(dbRace, r);
  });
  if (updatedRaces.length > 0) {
    const updateRaceStmt = db.prepare(
      `UPDATE race SET name = ?, date = ?, track = ?, imageLink = ?, championshipId = ? WHERE id = ?`
    );
    const batchResult = await db.batch(updatedRaces.map(r => 
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

  const archivedRaces = racesInDB.filter(r => r.date < now);

  return { inserted: newRaces, updated: updatedRaces, archived: archivedRaces };
}