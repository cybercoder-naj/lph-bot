export interface SyncResults<T> {
  inserted: T[];
  updated: T[];
  archived: T[];
}

export function normalize(str: string) {
  return str.replace(/\s+|\r?\n/g, ' ').trim();
}
