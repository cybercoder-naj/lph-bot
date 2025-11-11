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

    const races: Race[] = [
      { name: "Race 1", date: futureDate, track: "Track A", imageLink: null, championship },
      { name: "Race 2", date: futureDate, track: "Track B", imageLink: null, championship },
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

    const racesInDB: Race[] = [
      { id: 1, name: "Race 1", date: futureDate, track: "Track A", imageLink: null, championship },
    ];
    const races: Race[] = [
      { id: 1, name: "Race 1 Updated", date: futureDate, track: "Track A", imageLink: null, championship },
    ];

    const { inserted, updated, archived } = partitionRaces(races, racesInDB);

    expect(inserted).toHaveLength(0);
    expect(updated).toHaveLength(1);
    expect(archived).toHaveLength(0);

    expect(updated[0].name).toBe("Race 1 Updated");
  });

  it("should classify archived races correctly", () => {
    const now = new Date(2024, 0, 1); // Jan 1, 2024
    vi.setSystemTime(now);

    const pastDate = new Date(2023, 5, 1).toISOString(); // June 1, 2023

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

  it("should handle mixed cases", () => {
    const now = new Date(2024, 0, 1); // Jan 1, 2024
    vi.setSystemTime(now);

    const pastDate = new Date(2023, 5, 1).toISOString();
    const futureDate = new Date(2024, 5, 1).toISOString();

    const racesInDB: Race[] = [
      { id: 1, name: "Race 1", date: pastDate, track: "Track A", imageLink: null, championship },
      { id: 2, name: "Race 2", date: futureDate, track: "Track B", imageLink: null, championship },
    ];
    const races: Race[] = [
      { name: "Race 3", date: futureDate, track: "Track C", imageLink: null, championship },
      { id: 2, name: "Race 2 Updated", date: futureDate, track: "Track B", imageLink: null, championship },
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
