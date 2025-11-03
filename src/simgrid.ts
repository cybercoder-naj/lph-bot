export async function searchChampionships() {
  let response: Response | null;
  try {
    response = await fetch("https://www.thesimgrid.com/search?search=Endurance&games[]=1&games[]=65");
  } catch (error) {
    console.error(`Error fetching search results: ${error}`);
    throw error;
  }

  if (!response.ok) {
    console.error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    throw new Error(`Error fetching search results: ${response.statusText}`);
  }

  const data = await response.text();
  console.log(`Fetched search results successfully, length: ${data.length} characters`);
  return data;
}

export async function searchRaces(racesLink: string) {
  let response: Response | null;
  try {
    response = await fetch(racesLink);
  } catch (error) {
    console.error(`Error fetching races page: ${error}`);
    throw error;
  }
  
  if (!response.ok) {
    console.error(`Failed to fetch races page: ${response.status} ${response.statusText}`);
    throw new Error(`Error fetching races page: ${response.statusText}`);
  }
  
  const data = await response.text();
  console.log(`Fetched races page successfully, length: ${data.length} characters`);
  return data;
}