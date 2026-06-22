import type { SQLiteDatabase } from 'expo-sqlite';

import type { Setlist, SetlistSong } from '../../domain/models';

interface SetlistRow {
  id: string;
  title: string;
  event_name: string;
  event_date: string;
}

interface SetlistSongRow {
  setlist_id: string;
  song_id: string;
  sort_order: number;
}

export class SetlistRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async save(setlist: Setlist): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO setlists (id, title, event_name, event_date)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         event_name = excluded.event_name,
         event_date = excluded.event_date`,
      setlist.id,
      setlist.title,
      setlist.eventName,
      setlist.eventDate,
    );
  }

  public async findById(id: string): Promise<Setlist | null> {
    const row = await this.database.getFirstAsync<SetlistRow>(
      'SELECT * FROM setlists WHERE id = ?',
      id,
    );
    return row ? toSetlist(row) : null;
  }

  public async findAll(): Promise<readonly Setlist[]> {
    const rows = await this.database.getAllAsync<SetlistRow>(
      'SELECT * FROM setlists ORDER BY event_date DESC, title',
    );
    return rows.map(toSetlist);
  }

  public async replaceSongs(
    setlistId: string,
    songs: readonly SetlistSong[],
  ): Promise<void> {
    validateSetlistSongs(setlistId, songs);

    await this.database.withTransactionAsync(async () => {
      await this.database.runAsync(
        'DELETE FROM setlist_songs WHERE setlist_id = ?',
        setlistId,
      );

      for (const song of songs) {
        await this.database.runAsync(
          `INSERT INTO setlist_songs (setlist_id, song_id, sort_order)
           VALUES (?, ?, ?)`,
          song.setlistId,
          song.songId,
          song.order,
        );
      }
    });
  }

  public async findSongs(setlistId: string): Promise<readonly SetlistSong[]> {
    const rows = await this.database.getAllAsync<SetlistSongRow>(
      `SELECT * FROM setlist_songs
       WHERE setlist_id = ?
       ORDER BY sort_order`,
      setlistId,
    );
    return rows.map((row) => ({
      setlistId: row.setlist_id,
      songId: row.song_id,
      order: row.sort_order,
    }));
  }

  public async remove(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM setlists WHERE id = ?', id);
  }
}

function toSetlist(row: SetlistRow): Setlist {
  return {
    id: row.id,
    title: row.title,
    eventName: row.event_name,
    eventDate: row.event_date,
  };
}

function validateSetlistSongs(
  setlistId: string,
  songs: readonly SetlistSong[],
): void {
  const orders = new Set<number>();

  for (const song of songs) {
    if (song.setlistId !== setlistId) {
      throw new Error('Setlist song belongs to a different setlist.');
    }
    if (
      !Number.isInteger(song.order) ||
      song.order < 0 ||
      orders.has(song.order)
    ) {
      throw new Error(
        'Setlist song order must be a unique non-negative integer.',
      );
    }
    orders.add(song.order);
  }
}
