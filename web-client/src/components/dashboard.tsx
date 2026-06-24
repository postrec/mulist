'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ChevronDown,
  Cloud,
  FileMusic,
  Grid2X2,
  HardDrive,
  ListMusic,
  LogOut,
  Music2,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Song } from '@/types/song';
import {
  deleteSong,
  subscribeSongs,
  updateSong,
} from '@/features/library/song-service';
import { UploadModal } from '@/features/library/upload-modal';
import { SongModal } from '@/features/library/song-modal';
import { SetlistsView } from '@/features/setlists/setlists-view';
import { AdminView } from '@/features/admin/admin-view';
import { BulkEditModal } from '@/features/library/bulk-edit-modal';

export function Dashboard({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  const [songs, setSongs] = useState<Song[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [upload, setUpload] = useState<false | 'files' | 'drive'>(false),
    [selected, setSelected] = useState<Song | null>(null),
    [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()),
    [bulkEdit, setBulkEdit] = useState(false),
    [view, setView] = useState<'library' | 'setlists' | 'admin'>('library'),
    [profile, setProfile] = useState(false);
  useEffect(
    () =>
      subscribeSongs(
        user.uid,
        (value) => {
          setSongs(value);
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        },
      ),
    [user.uid],
  );
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return songs.filter((s) =>
      `${s.title} ${s.artist} ${s.tags.join(' ')}`.toLowerCase().includes(q),
    );
  }, [songs, search]);
  const selectedSongs = useMemo(
    () => songs.filter((song) => selectedIds.has(song.id)),
    [selectedIds, songs],
  );
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white p-5 lg:flex">
        <Logo />
        <nav className="mt-12 space-y-1">
          <Nav
            active={view === 'library'}
            icon={<Grid2X2 />}
            label="라이브러리"
            onClick={() => setView('library')}
          />
          <Nav
            active={view === 'setlists'}
            icon={<ListMusic />}
            label="셋리스트"
            onClick={() => setView('setlists')}
          />
          {user.email?.toLowerCase() === 'sion@sionuu.com' && (
            <Nav
              active={view === 'admin'}
              icon={<Shield />}
              label="관리자"
              onClick={() => setView('admin')}
            />
          )}
        </nav>
        <div className="mt-auto rounded-2xl bg-ink p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-bold text-lime">
            <Cloud size={15} />
            SYNC ONLINE
          </div>
          <p className="mt-2 text-xs leading-5 text-white/55">
            iPad와 변경사항이 실시간으로 동기화됩니다.
          </p>
        </div>
      </aside>
      <div className="pb-20 lg:pb-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-line bg-canvas/90 px-5 backdrop-blur-xl md:px-9">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="곡, 아티스트, 태그 검색"
              className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-ink"
            />
          </div>
          <button
            onClick={() => setUpload('files')}
            className="hidden items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white sm:flex"
          >
            <Upload size={17} />
            PDF 업로드
          </button>
          <button
            onClick={() => setUpload('drive')}
            className="hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-ink xl:flex"
          >
            <HardDrive size={17} />
            Drive 링크
          </button>
          <div className="relative">
            <button
              onClick={() => setProfile(!profile)}
              className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-2"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime text-xs font-black">
                {user.email?.[0].toUpperCase()}
              </span>
              <ChevronDown size={14} />
            </button>
            {profile && (
              <button
                onClick={onSignOut}
                className="absolute right-0 top-14 flex w-36 items-center gap-2 rounded-xl border border-line bg-white p-3 text-sm font-bold shadow-soft"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 md:p-9">
          {view === 'admin' ? (
            <AdminView />
          ) : view === 'setlists' ? (
            <SetlistsView uid={user.uid} songs={songs} />
          ) : (
            <>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[.16em] text-muted">
                    My collection
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">
                    라이브러리
                  </h1>
                  <p className="mt-2 text-muted">
                    <b className="text-ink">{songs.length}곡</b>의 악보가
                    준비되어 있어요.
                  </p>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <button className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm">
                    <ArrowDownUp size={16} />
                    최근 추가
                  </button>
                  <button className="rounded-xl border border-line bg-white p-2">
                    <SlidersHorizontal size={17} />
                  </button>
                </div>
              </div>
              {error && (
                <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  Firestore 연결 오류: {error}
                </p>
              )}
              {selectedSongs.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-soft">
                  <b className="ml-1 text-sm">{selectedSongs.length}곡 선택</b>
                  <button onClick={() => setBulkEdit(true)} className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">일괄 변경</button>
                  <button onClick={() => setSelectedIds(new Set())} className="ml-auto flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-muted hover:bg-canvas"><X size={15}/> 선택 해제</button>
                </div>
              )}
              <Library
                uid={user.uid}
                songs={filtered}
                loading={loading}
                onUpload={() => setUpload('files')}
                onSelect={setSelected}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
              />
            </>
          )}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-2 border-t border-line bg-white lg:hidden">
        <button
          onClick={() => setView('library')}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-bold ${view === 'library' ? 'text-ink' : 'text-muted'}`}
        >
          <Grid2X2 size={19} />
          라이브러리
        </button>
        <button
          onClick={() => setView('setlists')}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-bold ${view === 'setlists' ? 'text-ink' : 'text-muted'}`}
        >
          <ListMusic size={19} />
          셋리스트
        </button>
      </nav>
      <button
        onClick={() => setUpload('files')}
        className="fixed bottom-20 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white shadow-soft sm:hidden"
      >
        <Plus />
      </button>
      {upload && (
        <UploadModal
          uid={user.uid}
          initialMode={upload}
          onClose={() => setUpload(false)}
        />
      )}{' '}
      {selected && (
        <SongModal
          uid={user.uid}
          song={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {bulkEdit && selectedSongs.length > 0 && (
        <BulkEditModal
          uid={user.uid}
          songs={selectedSongs}
          onClose={() => setBulkEdit(false)}
          onSaved={() => {
            setBulkEdit(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
function Library({
  uid,
  songs,
  loading,
  onUpload,
  onSelect,
  selectedIds,
  onSelectedIdsChange,
}: {
  uid: string;
  songs: Song[];
  loading: boolean;
  onUpload: () => void;
  onSelect: (s: Song) => void;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
}) {
  if (loading)
    return (
      <div className="grid min-h-96 place-items-center text-sm text-muted">
        라이브러리를 불러오는 중…
      </div>
    );
  if (!songs.length)
    return (
      <div className="grid min-h-96 place-items-center rounded-[24px] border border-line bg-white text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-lime">
            <FileMusic size={28} />
          </span>
          <h2 className="mt-5 text-xl font-bold">첫 악보를 추가해 보세요</h2>
          <p className="mt-2 text-sm text-muted">
            PDF를 올리면 Song이 자동으로 만들어집니다.
          </p>
          <button
            onClick={onUpload}
            className="mt-6 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white"
          >
            PDF 업로드
          </button>
        </div>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white">
      <div className="hidden grid-cols-[32px_minmax(260px,2fr)_1.2fr_90px_1fr_120px_60px] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted md:grid">
        <input type="checkbox" aria-label="현재 목록 전체 선택" checked={songs.length > 0 && songs.every((song)=>selectedIds.has(song.id))} onChange={(event)=>{ const next=new Set(selectedIds); for(const song of songs) event.target.checked?next.add(song.id):next.delete(song.id); onSelectedIdsChange(next); }} className="h-4 w-4 accent-ink" />
        <span>Song</span>
        <span>Artist</span>
        <span>BPM</span>
        <span>Tags</span>
        <span>Added</span>
        <span />
      </div>
      {songs.map((song) => (
        <div
          key={song.id}
          onDoubleClick={() => onSelect(song)}
          className={`group grid cursor-pointer grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-line px-4 py-4 last:border-0 hover:bg-canvas/70 md:grid-cols-[32px_minmax(260px,2fr)_1.2fr_90px_1fr_120px_60px] md:gap-4 md:px-5 ${selectedIds.has(song.id)?'bg-lime/10':''}`}
        >
          <input type="checkbox" aria-label={`${song.title} 선택`} checked={selectedIds.has(song.id)} onClick={(event)=>event.stopPropagation()} onChange={(event)=>{ const next=new Set(selectedIds); event.target.checked?next.add(song.id):next.delete(song.id); onSelectedIdsChange(next); }} className="h-4 w-4 accent-ink" />
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() =>
                updateSong(uid, song, { favorite: !song.favorite })
              }
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${song.favorite ? 'bg-lime' : 'bg-canvas'}`}
            >
              <Music2 size={18} />
            </button>
            <div className="min-w-0" onClick={() => onSelect(song)}>
              <p className="truncate font-bold">{song.title}</p>
              <p className="mt-1 text-xs text-muted md:hidden">
                {song.artist || '아티스트 없음'} · {song.bpm ?? '—'} BPM
              </p>
            </div>
          </div>
          <span className="hidden truncate text-sm text-muted md:block">
            {song.artist || '—'}
          </span>
          <span className="hidden text-sm font-bold md:block">
            {song.bpm ?? '—'}
          </span>
          <div className="hidden gap-1 md:flex">
            {song.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-canvas px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="hidden text-xs text-muted md:block">
            {song.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? '—'}
          </span>
          <button
            onClick={() =>
              confirm(`‘${song.title}’을 삭제할까요?`) && deleteSong(uid, song)
            }
            className="rounded-lg p-2 text-muted opacity-100 hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
    </div>
  );
}
function Nav({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${active ? 'bg-ink text-white' : 'text-muted hover:bg-canvas hover:text-ink'}`}
    >
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {label}
    </button>
  );
}
function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 font-black tracking-[-.03em]">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime">
        <Music2 size={21} />
      </span>
      {!compact && <span className="text-xl">MuList</span>}
    </div>
  );
}
