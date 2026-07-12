export interface StoredEvidenceFile {
  evidenceId: string
  name: string
  localPath: string
  fileType: string
  fileSize: number
  checksumSha256?: string
}

export interface FileStore {
  select(evidenceId: string): Promise<StoredEvidenceFile | null>
  remove(evidenceId: string): Promise<void>
  reveal(evidenceId: string): Promise<void>
}

// Desktop file-system adapter boundary.
export const fileStore: FileStore | null = null
