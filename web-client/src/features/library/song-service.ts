import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import type { Song } from '@/types/song';

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export async function downloadGoogleDrivePdf(url: string): Promise<File> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch('/api/import/google-drive', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'Google Drive 파일을 가져오지 못했습니다.');
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const name = encoded ? decodeURIComponent(encoded) : 'google-drive.pdf';
  const blob = await response.blob();
  if (blob.size > MAX_PDF_BYTES) throw new Error('파일당 최대 크기는 50MB입니다.');
  return new File([blob], name, { type: 'application/pdf' });
}
export function subscribeSongs(uid:string, next:(songs:Song[])=>void, fail:(error:Error)=>void):Unsubscribe {
  return onSnapshot(query(collection(db,'users',uid,'songs'), orderBy('createdAt','desc')), snap => next(snap.docs.map(item => ({ id:item.id, ...item.data() } as Song)).filter(song=>!song.deletedAt)), fail);
}
function put(path:string, data:Blob|string, contentType:string, progress?:(value:number)=>void):Promise<void> {
  return new Promise((resolve,reject)=>{ const body = typeof data === 'string' ? new Blob([data],{type:contentType}) : data; const task=uploadBytesResumable(ref(storage,path),body,{contentType}); task.on('state_changed',s=>progress?.(s.bytesTransferred/s.totalBytes),reject,()=>resolve()); });
}
function baseTitle(name:string) { return name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').trim() || 'Untitled'; }
export async function createSongFromPdf(uid:string,file:File,onProgress:(v:number)=>void):Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('PDF 파일만 업로드할 수 있습니다.');
  if (file.size > MAX_PDF_BYTES) throw new Error('파일당 최대 크기는 50MB입니다.');
  const songRef=doc(collection(db,'users',uid,'songs')); const songId=songRef.id; const scoreId=crypto.randomUUID(); const base=`users/${uid}/songs/${songId}`; const now=new Date().toISOString();
  const cloud={ title:baseTitle(file.name), artist:'', bpm:null, createdAt:Timestamp.now(), deletedAt:null, deviceId:'web', favorite:false, originalKey:null, preferredKey:null, revision:1, scoreIds:[scoreId], tags:[], updatedAt:Timestamp.now() };
  const manifest={ firestorePath:`users/${uid}/songs/${songId}`, schemaVersion:2, song:{...cloud,id:songId,ownerId:uid,createdAt:now,updatedAt:now,serverUpdatedAt:now,syncStatus:'synced'}, storage:{metadataPath:`${base}/metadata.json`,scores:[{id:scoreId,pdfPath:`${base}/${scoreId}.pdf`,sidecarPath:`${base}/${scoreId}.sidecar.json`}]} };
  const sidecar={contentHash:null,noteLayer:{version:1,strokes:[]},ocrData:{version:1,pages:[]},viewState:{page:1,zoom:1,rotation:0},song:manifest};
  await put(`${base}/${scoreId}.pdf`,file,'application/pdf',v=>onProgress(v*.84));
  await put(`${base}/${scoreId}.sidecar.json`,JSON.stringify(sidecar),'application/json'); onProgress(.9);
  await put(`${base}/metadata.json`,JSON.stringify(manifest,null,2),'application/json'); onProgress(.96);
  await runTransaction(db, async tx=>tx.set(songRef,cloud)); onProgress(1); return songId;
}
export async function updateSong(uid:string,song:Song,patch:Partial<Pick<Song,'title'|'artist'|'bpm'|'tags'|'favorite'>>) { await updateDoc(doc(db,'users',uid,'songs',song.id),{...patch,revision:song.revision+1,updatedAt:serverTimestamp(),deviceId:'web'}); }
export async function deleteSong(uid:string,song:Song) { await updateDoc(doc(db,'users',uid,'songs',song.id),{deletedAt:serverTimestamp(),revision:song.revision+1,updatedAt:serverTimestamp(),deviceId:'web'}); }
export async function openScore(uid:string,song:Song) { if (!song.scoreIds[0]) throw new Error('연결된 PDF가 없습니다.'); window.open(await getDownloadURL(ref(storage,`users/${uid}/songs/${song.id}/${song.scoreIds[0]}.pdf`)),'_blank','noopener,noreferrer'); }
