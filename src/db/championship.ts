import { Race } from './race';

export type SupportedGames = 'ACC' | 'LMU';

export type Championship = {
  id: number;
  name: string;
  community: string;
  image?: string;
  game: SupportedGames;
  registration?: string;
  dates?: string;
  rounds?: string;

  // Navigational Races list
  races?: Race[];
};

export async function insertChampionship(db: D1Database, cs: Championship[]) {
  console.log(`Inserting ${cs.length} championships`);

  // @ts-ignore cs.length > 0
  const insertStmt =
    db.prepare(`INSERT INTO championship (id, name, community, image, game, registration, dates, rounds) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        community=excluded.community,
        image=excluded.image,
        game=excluded.game,
        registration=excluded.registration,
        dates=excluded.dates,
        rounds=excluded.rounds
    `);

  const batchResult = await db.batch(
    cs.map(c => insertStmt.bind(c.id, c.name, c.community, c.image, c.game, c.registration, c.dates, c.rounds))
  );

  if (batchResult.some(r => !r.success)) {
    console.error('Error inserting championships:', batchResult);
    throw new Error('Failed to insert some championships');
  }

  return batchResult.flatMap(r => r.results);
}
