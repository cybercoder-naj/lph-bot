CREATE TABLE championship (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  community TEXT NOT NULL,
  image TEXT,
  game TEXT NOT NULL,
  registration TEXT,
  dates TEXT,
  rounds TEXT
);

CREATE TABLE race (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    track TEXT NOT NULL,
    imageLink TEXT,
    championshipId INTEGER NOT NULL,
    FOREIGN KEY (championshipId) REFERENCES championship(id) ON DELETE CASCADE
);
