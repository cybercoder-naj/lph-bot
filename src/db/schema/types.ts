export type Championship = {
  id: number;
  name: string;
  community: string;
  image: string;
  game: string;
  registration: string;
  dates: string;
  rounds: string;

  // Navigational Races list
  races?: Race[] 
}

export type Race = {
  id?: number; // Auto-incremented ID
  name: string;
  date: string;
  track: string;
  imageLink: string | null;

  // Foreign key reference
  championshipId: number;
}