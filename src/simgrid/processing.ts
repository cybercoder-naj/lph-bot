import type { Championship } from '../types';

export function postProcessChampionships(championships: Championship[]): Record<string, Championship> {
  console.log('Post-processing championships...');

  const filtered = championships.filter(c => c.registration !== 'Closed');

  const championshipAsObject = Object.fromEntries(filtered.map(c => [c.id, c]));

  return championshipAsObject;
}
