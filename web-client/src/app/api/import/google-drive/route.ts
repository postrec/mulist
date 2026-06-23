import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;
const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

export async function POST(request: NextRequest) {
  try {
    await requireFirebaseUser(request);
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== 'string') return error('Google Drive 링크를 입력해 주세요.', 400);
    const source = parseDriveUrl(body.url);
    if (!source) return error('지원하지 않는 Google Drive 링크입니다.', 400);

    const download = new URL('https://drive.usercontent.google.com/download');
    download.searchParams.set('id', source.id);
    download.searchParams.set('export', 'download');
    download.searchParams.set('confirm', 't');
    if (source.resourceKey) download.searchParams.set('resourcekey', source.resourceKey);

    const response = await fetch(download, { redirect: 'follow', signal: AbortSignal.timeout(45_000) });
    if (!response.ok) return error('파일을 다운로드할 수 없습니다. 링크 공개 설정을 확인해 주세요.', 422);
    const declaredSize = Number(response.headers.get('content-length') ?? 0);
    if (declaredSize > MAX_BYTES) return error('파일당 최대 크기는 50MB입니다.', 413);

    const reader = response.body?.getReader();
    if (!reader) return error('Google Drive 응답을 읽을 수 없습니다.', 502);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return error('파일당 최대 크기는 50MB입니다.', 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    if (!isPdf(bytes)) return error('공개 PDF 파일이 아닙니다. 공유 권한과 파일 형식을 확인해 주세요.', 422);

    const fileName = getFileName(response.headers.get('content-disposition')) ?? `google-drive-${source.id.slice(0, 8)}.pdf`;
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(size),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (reason) {
    if (reason instanceof Error && reason.message === 'UNAUTHORIZED') return error('로그인이 필요합니다.', 401);
    if (reason instanceof Error && reason.name === 'TimeoutError') return error('Google Drive 다운로드 시간이 초과됐습니다.', 504);
    return error('Google Drive 파일을 가져오지 못했습니다.', 500);
  }
}

async function requireFirebaseUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) throw new Error('UNAUTHORIZED');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), cache: 'no-store',
  });
  if (!response.ok) throw new Error('UNAUTHORIZED');
}

function parseDriveUrl(value: string): { id: string; resourceKey?: string } | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;
    const pathId = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/)?.[1];
    const id = pathId ?? url.searchParams.get('id');
    if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) return null;
    const resourceKey = url.searchParams.get('resourcekey') ?? undefined;
    return { id, resourceKey };
  } catch { return null; }
}

function isPdf(bytes: Uint8Array) {
  return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}
function getFileName(header: string | null) {
  if (!header) return null;
  const encoded = header.match(/filename\*\s*=\s*UTF-8'[^']*'("?[^";]+"?)/i)?.[1]?.replace(/^"|"$/g, '');
  const plain = header.match(/filename\s*=\s*"([^"]+)"/i)?.[1] ?? header.match(/filename\s*=\s*([^;]+)/i)?.[1]?.trim();
  const value = encoded ? safeDecodeUri(encoded) : decodeMimeFileName(plain);
  if (!value) return null;
  const safe = repairUtf8Mojibake(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
}
function safeDecodeUri(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}
function decodeMimeFileName(value?: string) {
  if (!value) return null;
  const base64 = value.match(/^=\?UTF-8\?B\?([^?]+)\?=$/i)?.[1];
  if (base64) return Buffer.from(base64, 'base64').toString('utf8');
  const quoted = value.match(/^=\?UTF-8\?Q\?([^?]+)\?=$/i)?.[1];
  if (quoted) return Buffer.from(quoted.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, '%$1').split('%').map((part,index)=>index===0?part:String.fromCharCode(Number.parseInt(part.slice(0,2),16))+part.slice(2)).join(''), 'binary').toString('utf8');
  return value.includes('%') ? safeDecodeUri(value) : value;
}
function repairUtf8Mojibake(value: string) {
  if (!/[\u0080-\u009f]|Ã|Â|ì|ë|ê/.test(value)) return value;
  const repaired = Buffer.from(value, 'latin1').toString('utf8');
  return repaired.includes('\uFFFD') ? value : repaired;
}
function error(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }
