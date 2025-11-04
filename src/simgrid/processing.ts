import { Championship } from "../types";

export function postProcessChampionships(championships: Championship[]): Record<string, Championship> {
  const filtered = championships.filter(c =>
    c.registration !== 'Closed'
  );

  const championshipAsObject = Object.fromEntries(
    filtered.map(c => [c.id, c])
  );

  console.log(`Post-processed championships, count: ${Object.keys(championshipAsObject).length}`);
  return championshipAsObject;
}