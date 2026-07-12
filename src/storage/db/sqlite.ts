export type DatabaseTable =
  | 'projects'
  | 'controls'
  | 'evidence_items'
  | 'evidence_files'
  | 'evidence_control_links'
  | 'risks'
  | 'report_sections'
  | 'exports'

export interface SqliteDatabase {
  initialize(): Promise<void>
  get<T>(table: DatabaseTable, id: string): Promise<T | null>
  list<T>(table: DatabaseTable, projectId: string): Promise<readonly T[]>
  put<T extends { id: string }>(table: DatabaseTable, value: T): Promise<void>
  close(): Promise<void>
}

export interface SqliteDatabaseFactory {
  open(databasePath: string): Promise<SqliteDatabase>
}

// Desktop runtime adapter boundary. No browser implementation is provided yet.
export const sqliteDatabaseFactory: SqliteDatabaseFactory | null = null
