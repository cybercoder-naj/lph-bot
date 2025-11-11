import { searchChampionships, searchRaces } from './fetch';
import { parseChampionshipPage, parseRacePage } from './parser';
import { postProcessChampionships } from './processing';
import { insertChampionship, syncRaces } from '../db';
import { SyncResults } from './utils';
import { Race } from '../types';

export async function syncChampionshipAndRaces(db: D1Database): Promise<SyncResults<Race>> {
  console.log('Starting sync of championships and races...');

  const championshipSearchPage = await searchChampionships();
  const championships = parseChampionshipPage(championshipSearchPage);
  const processedChampionships = postProcessChampionships(championships);

  for (const championshipId in processedChampionships) {
    const championship = processedChampionships[championshipId];
    const races = await searchRaces(championship.id);
    const parsedRaces = parseRacePage(races, championship);

    processedChampionships[championshipId] = {
      ...championship,
      races: parsedRaces
    };
  }

  await insertChampionship(db, Object.values(processedChampionships));

  const races = Object.values(processedChampionships).flatMap(c => c.races || []);
  const syncResult = await syncRaces(db, races);

  return syncResult;
}
