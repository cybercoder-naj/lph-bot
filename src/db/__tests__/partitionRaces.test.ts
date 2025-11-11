import { partitionRaces } from "../race";
import { Championship, Race } from "../types"; // Adjust path
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

const championship: Championship = { id: 1, name: "Championship 1", community: "Community A", game: "ACC" };

describe("partitionRaces", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  })
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should classify new races correctly", () => {
    const now = new Date(2024, 0, 1); // Jan 1, 2024
    vi.setSystemTime(now);

    const futureDate = new Date(2024, 5, 1).toISOString(); // June 1, 2024

    // There are 2 new races that don't exist in DB
    const races: Race[] = [
      { name: "Race 1", date: futureDate, track: "Track A", imageLink: null, championship },
      { name: "Race 2", date: futureDate, track: "Track E", imageLink: null, championship },
    ];
    const racesInDB: Race[] = [];

    const { inserted, updated, archived } = partitionRaces(races, racesInDB);

    expect(inserted).toHaveLength(2);
    expect(updated).toHaveLength(0);
    expect(archived).toHaveLength(0);

    expect(inserted).toContainEqual(races[0]);
    expect(inserted).toContainEqual(races[1]);
  });

  it("should classify updated races correctly", () => {
    const now = new Date(2024, 0, 1); // Jan 1, 2024
    vi.setSystemTime(now);

    const futureDate = new Date(2024, 5, 1).toISOString(); // June 1, 2024

    // There is a race that exists but has different track
    const racesInDB: Race[] = [
      { id: 1, name: "Race 1", date: futureDate, track: "Track A", imageLink: null, championship },
    ];
    const races: Race[] = [
      { name: "Race 1", date: futureDate, track: "Track B", imageLink: null, championship },
    ];

    const { inserted, updated, archived } = partitionRaces(races, racesInDB);

    expect(inserted).toHaveLength(0);
    expect(updated).toHaveLength(1);
    expect(archived).toHaveLength(0);

    expect(updated[0].track).toBe("Track B");
  });

  it("should classify archived races correctly", () => {
    const now = new Date(2024, 0, 1); // Jan 1, 2024
    vi.setSystemTime(now);

    const pastDate = new Date(2023, 5, 1).toISOString(); // June 1, 2023

    // A race in the DB is in the past
    const racesInDB: Race[] = [
      { id: 1, name: "Race 1", date: pastDate, track: "Track A", imageLink: null, championship },
    ];
    const races: Race[] = [];

    const { inserted, updated, archived } = partitionRaces(races, racesInDB);

    expect(inserted).toHaveLength(0);
    expect(updated).toHaveLength(0);
    expect(archived).toHaveLength(1);

    expect(archived[0].id).toBe(1);
  });

  it("should not return any races when there are no changes", () => {
    const now = new Date(2024, 0, 1);
    vi.setSystemTime(now);

    const futureDate = new Date(2024, 5, 1).toISOString();

    // Same race is present in both lists with identical data
    const racesInDB: Race[] = [
      { id: 1, name: "Race 1", date: futureDate, track: "Track A", imageLink: null, championship },
    ];
    const races: Race[] = [
      { name: "Race 1", date: futureDate, track: "Track A", imageLink: null, championship },
    ];

    const { inserted, updated, archived } = partitionRaces(races, racesInDB);

    expect(inserted).toHaveLength(0);
    expect(updated).toHaveLength(0);
    expect(archived).toHaveLength(0);
  });

  it("should handle mixed cases", () => {
    const now = new Date(2024, 0, 1); // Jan 1, 2024
    vi.setSystemTime(now);

    const pastDate = new Date(2023, 5, 1).toISOString();
    const futureDate = new Date(2024, 5, 1).toISOString();

    // Race 1 is archived
    // Race 2 is updated
    // Race 3 is new
    // Race 4 is unchanged
    const racesInDB: Race[] = [
      { id: 1, name: "Race 1", date: pastDate, track: "Track A", imageLink: null, championship },
      { id: 2, name: "Race 2", date: futureDate, track: "Track B", imageLink: null, championship },
      { id: 4, name: "Race 4", date: futureDate, track: "Track D", imageLink: null, championship },
    ];
    const races: Race[] = [
      { name: "Race 3", date: futureDate, track: "Track C", imageLink: null, championship },
      { name: "Race 2", date: futureDate, track: "Track E", imageLink: null, championship },
      { name: "Race 4", date: futureDate, track: "Track D", imageLink: null, championship },
    ];

    const { inserted, updated, archived } = partitionRaces(races, racesInDB);

    expect(inserted).toHaveLength(1);
    expect(inserted[0].name).toBe("Race 3");

    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(2);

    expect(archived).toHaveLength(1);
    expect(archived[0].id).toBe(1);
  });
});
