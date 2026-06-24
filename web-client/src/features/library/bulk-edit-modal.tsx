'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

import type { Song } from '@/types/song';
import { updateSongs, type BulkSongPatch } from './song-service';

type ChangeMode = 'keep' | 'set' | 'clear';
type TagMode = 'keep' | 'replace' | 'add' | 'remove';
type FavoriteMode = 'keep' | 'favorite' | 'normal';

export function BulkEditModal({
  uid,
  songs,
  onClose,
  onSaved,
}: {
  uid: string;
  songs: Song[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [artistMode, setArtistMode] = useState<ChangeMode>('keep');
  const [artist, setArtist] = useState('');
  const [bpmMode, setBpmMode] = useState<ChangeMode>('keep');
  const [bpm, setBpm] = useState('');
  const [tagMode, setTagMode] = useState<TagMode>('keep');
  const [tags, setTags] = useState('');
  const [favoriteMode, setFavoriteMode] = useState<FavoriteMode>('keep');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (
      artistMode === 'keep' && bpmMode === 'keep' &&
      tagMode === 'keep' && favoriteMode === 'keep'
    ) {
      setError('변경할 항목을 하나 이상 선택해 주세요.');
      return;
    }
    const parsedBpm = Number(bpm);
    if (bpmMode === 'set' && (!Number.isFinite(parsedBpm) || parsedBpm < 1 || parsedBpm > 400)) {
      setError('BPM은 1부터 400 사이로 입력해 주세요.');
      return;
    }
    const parsedTags = unique(tags.split(',').map((value) => value.trim()).filter(Boolean));
    if (tagMode !== 'keep' && parsedTags.length === 0) {
      setError('태그를 하나 이상 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await updateSongs(uid, songs, (song) => makePatch(song, {
        artist: artist.trim(), artistMode, bpmMode, favoriteMode,
        parsedBpm, parsedTags, tagMode,
      }));
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '일괄 변경하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-7 shadow-soft animate-rise">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-muted">Bulk edit</p>
            <h2 className="mt-2 text-2xl font-bold">{songs.length}곡 일괄 변경</h2>
            <p className="mt-2 text-sm text-muted">곡 제목은 변경되지 않습니다.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-canvas"><X size={20}/></button>
        </div>
        <div className="mt-7 grid gap-6">
          <EditField label="아티스트" mode={artistMode} onMode={setArtistMode} options={[['keep','유지'],['set','설정'],['clear','비우기']]}>
            {artistMode === 'set' && <input value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="아티스트 이름" className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink" />}
          </EditField>
          <EditField label="BPM" mode={bpmMode} onMode={setBpmMode} options={[['keep','유지'],['set','설정'],['clear','비우기']]}>
            {bpmMode === 'set' && <input type="number" min={1} max={400} value={bpm} onChange={(event) => setBpm(event.target.value)} placeholder="120" className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink" />}
          </EditField>
          <EditField label="태그" mode={tagMode} onMode={setTagMode} options={[['keep','유지'],['replace','교체'],['add','추가'],['remove','제거']]}>
            {tagMode !== 'keep' && <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="쉼표로 구분: kpop, ballad" className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink" />}
          </EditField>
          <EditField label="즐겨찾기" mode={favoriteMode} onMode={setFavoriteMode} options={[['keep','유지'],['favorite','지정'],['normal','해제']]} />
        </div>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-8 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-bold hover:bg-canvas">취소</button>
          <button disabled={saving} className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? '변경 중…' : `${songs.length}곡 변경`}</button>
        </div>
      </form>
    </div>
  );
}

function EditField<T extends string>({ label, mode, onMode, options, children }: { label:string; mode:T; onMode:(value:T)=>void; options:Array<[T,string]>; children?:React.ReactNode }) {
  return <fieldset><legend className="mb-2 text-sm font-bold">{label}</legend><div className="flex flex-wrap gap-2">{options.map(([value,text])=><button key={value} type="button" onClick={()=>onMode(value)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${mode===value?'border-ink bg-ink text-white':'border-line bg-white'}`}>{text}</button>)}</div>{children&&<div className="mt-3">{children}</div>}</fieldset>;
}

function makePatch(song:Song, values:{ artist:string; artistMode:ChangeMode; bpmMode:ChangeMode; favoriteMode:FavoriteMode; parsedBpm:number; parsedTags:string[]; tagMode:TagMode }):BulkSongPatch {
  const patch:BulkSongPatch = {};
  if (values.artistMode === 'set') patch.artist = values.artist;
  if (values.artistMode === 'clear') patch.artist = '';
  if (values.bpmMode === 'set') patch.bpm = values.parsedBpm;
  if (values.bpmMode === 'clear') patch.bpm = null;
  if (values.favoriteMode !== 'keep') patch.favorite = values.favoriteMode === 'favorite';
  if (values.tagMode === 'replace') patch.tags = values.parsedTags;
  if (values.tagMode === 'add') patch.tags = unique([...song.tags, ...values.parsedTags]);
  if (values.tagMode === 'remove') { const removed = new Set(values.parsedTags.map(normalize)); patch.tags = song.tags.filter((tag)=>!removed.has(normalize(tag))); }
  return patch;
}
function unique(values:string[]) { return [...new Map(values.map((value)=>[normalize(value),value])).values()]; }
function normalize(value:string) { return value.trim().toLocaleLowerCase(); }
