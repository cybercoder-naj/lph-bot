export function postProcessChampionships(championships: any[]): Record<string, any> {
  const filtered = championships.filter(c =>
    c.registration !== 'Closed'
  ).map(c => {
    const championshipId = c.championshipLink.split('/').pop();
    c.id = championshipId;
    return c;
  });

  const championshipAsObject: Record<string, any> = Object.fromEntries(
    filtered.map(c => [c.id, c])
  );

  console.log(`Post-processed championships, count: ${championshipAsObject.length}`);
  return championshipAsObject;
}