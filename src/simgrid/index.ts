import { searchChampionships, searchRaces } from "./fetch";
import { parseChampionshipPage, parseRacePage } from "./parser";
import { postProcessChampionships } from "./processing";
import { upsertChampionship } from "../db/championship";
import { makeDb } from "../db";
import { syncRaces } from "../db/race";

export async function upsertChampionshipAndRaces(env: Env) {
  const db = makeDb(env.DB);

  console.log(`trigger fired at ${new Date().toISOString()}`);

  const championshipSearchPage = await searchChampionships();
  const championships = parseChampionshipPage(championshipSearchPage);
  const processedChampionships = postProcessChampionships(championships);

  console.log(`Parsed ${processedChampionships.length} events from search results.`);

  for (const championshipId in processedChampionships) {
    const championship = processedChampionships[championshipId];
    const races = await searchRaces(championship.id);
    const parsedRaces = parseRacePage(races, championship.id);

    console.log(`Parsed ${parsedRaces.length} races for championship: ${championship.name}`);
    console.log('Races:', parsedRaces);

    processedChampionships[championshipId] = {
      ...championship,
      races: parsedRaces,
    }
  }

  for (const championshipId in processedChampionships) {
    const championship = processedChampionships[championshipId];
    await upsertChampionship(db, championship);
  }

  for (const championshipId in processedChampionships) {
    const championship = processedChampionships[championshipId];
    if (championship.races) {
      const syncResult = await syncRaces(db, championship.races);
    }
  }
}