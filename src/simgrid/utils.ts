export interface SyncResults<T> {
  inserted: T[];
  updated: T[];
  archived: T[];
}
