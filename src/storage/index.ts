import { getDatabase } from './database';
import { OcrRepository } from './repositories/OcrRepository';
import { ScoreRepository } from './repositories/ScoreRepository';
import { SearchRepository } from './repositories/SearchRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { SetlistRepository } from './repositories/SetlistRepository';
import { SongRepository } from './repositories/SongRepository';

export interface Repositories {
  ocr: OcrRepository;
  songs: SongRepository;
  scores: ScoreRepository;
  search: SearchRepository;
  settings: SettingsRepository;
  setlists: SetlistRepository;
}

let repositoriesPromise: Promise<Repositories> | null = null;

export function getRepositories(): Promise<Repositories> {
  repositoriesPromise ??= createRepositories();
  return repositoriesPromise;
}

async function createRepositories(): Promise<Repositories> {
  const database = await getDatabase();
  return {
    ocr: new OcrRepository(database),
    songs: new SongRepository(database),
    scores: new ScoreRepository(database),
    search: new SearchRepository(database),
    settings: new SettingsRepository(database),
    setlists: new SetlistRepository(database),
  };
}
