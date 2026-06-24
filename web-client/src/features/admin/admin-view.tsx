'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  loadAdminDashboard,
  saveNormalizationCatalog,
  setAdminUserDisabled,
  type AdminDashboardData,
} from './admin-service';

const seedTags = [
  {
    id: 'kpop',
    labels: { ko: 'K-Pop', en: 'K-Pop', ja: 'K-Pop' },
    aliases: ['한국', '한국노래', '케이팝'],
  },
  {
    id: 'jpop',
    labels: { ko: 'J-Pop', en: 'J-Pop', ja: 'J-Pop' },
    aliases: ['일본', '일본노래', '제이팝'],
  },
  {
    id: 'pop',
    labels: { ko: 'Pop', en: 'Pop', ja: 'ポップ' },
    aliases: ['팝', '팝송'],
  },
  {
    id: 'rnb',
    labels: { ko: 'R&B', en: 'R&B', ja: 'R&B' },
    aliases: ['알앤비', 'r&b'],
  },
  {
    id: 'anime',
    labels: { ko: '애니송', en: 'Anime', ja: 'アニソン' },
    aliases: ['애니메이션', 'anime'],
  },
  {
    id: 'ballad',
    labels: { ko: '발라드', en: 'Ballad', ja: 'バラード' },
    aliases: ['ballad'],
  },
  {
    id: 'ccm',
    labels: { ko: 'CCM', en: 'CCM', ja: 'CCM' },
    aliases: ['교회음악', '교회'],
  },
  {
    id: 'indie',
    labels: { ko: 'Indie', en: 'Indie', ja: 'インディー' },
    aliases: ['인디', '인디밴드'],
  },
  {
    id: 'jazz',
    labels: { ko: '재즈', en: 'Jazz', ja: 'ジャズ' },
    aliases: ['재즈스탠다드', 'jazz standard'],
  },
  {
    id: 'rock',
    labels: { ko: '락', en: 'Rock', ja: 'ロック' },
    aliases: ['록', 'rock'],
  },
  {
    id: 'metal',
    labels: { ko: '메탈', en: 'Metal', ja: 'メタル' },
    aliases: ['metal'],
  },
  {
    id: 'vtuber',
    labels: { ko: '버튜버', en: 'VTuber', ja: 'VTuber' },
    aliases: ['버츄얼', '버추얼', 'vtuber'],
  },
  {
    id: 'game',
    labels: { ko: '게임음악', en: 'Game Music', ja: 'ゲーム音楽' },
    aliases: ['게임', 'game'],
  },
  {
    id: 'gugak',
    labels: { ko: '국악', en: 'Korean Traditional', ja: '韓国伝統音楽' },
    aliases: ['한국전통음악', 'traditional korean'],
  },
  {
    id: 'vocaloid',
    labels: { ko: '보컬로이드', en: 'Vocaloid', ja: 'ボーカロイド' },
    aliases: ['vocaloid'],
  },
];
const seedArtists = [
  {
    id: 'iu',
    names: { ko: '아이유', en: 'IU', ja: 'IU' },
    aliases: ['아이유', 'IU'],
  },
  {
    id: 'sung-si-kyung',
    names: { ko: '성시경', en: 'Sung Si Kyung', ja: 'ソン・シギョン' },
    aliases: ['성시경', 'Sung Si Kyung'],
  },
];

export function AdminView() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState('[]');
  const [artists, setArtists] = useState('[]');
  const [growthGb, setGrowthGb] = useState(10);
  const [egressGb, setEgressGb] = useState(10);
  const [reads, setReads] = useState(100_000);
  const [writes, setWrites] = useState(50_000);
  const [rates, setRates] = useState({
    storage: 0.026,
    egress: 0.12,
    reads: 0.06,
    writes: 0.18,
  });

  const reload = async () => {
    setError('');
    try {
      const next = await loadAdminDashboard();
      setData(next);
      setTags(
        JSON.stringify(
          next.catalog.tags?.length ? next.catalog.tags : seedTags,
          null,
          2,
        ),
      );
      setArtists(
        JSON.stringify(
          next.catalog.artists?.length ? next.catalog.artists : seedArtists,
          null,
          2,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '관리자 데이터를 불러오지 못했습니다.',
      );
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  const estimate = useMemo(
    () =>
      growthGb * rates.storage +
      egressGb * rates.egress +
      (reads / 100_000) * rates.reads +
      (writes / 100_000) * rates.writes,
    [egressGb, growthGb, rates, reads, writes],
  );

  const saveCatalog = async () => {
    setSaving(true);
    setError('');
    try {
      const parsedTags = JSON.parse(tags) as unknown;
      const parsedArtists = JSON.parse(artists) as unknown;
      if (!Array.isArray(parsedTags) || !Array.isArray(parsedArtists))
        throw new Error('JSON 최상위 값은 배열이어야 합니다.');
      await saveNormalizationCatalog(parsedTags, parsedArtists);
      await reload();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '카탈로그를 저장하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!data)
    return (
      <div className="py-20 text-center text-sm text-muted">
        {error || '관리자 데이터 불러오는 중…'}
      </div>
    );
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-muted">
          Admin
        </p>
        <h1 className="mt-2 text-4xl font-semibold">MuList 관리자</h1>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['사용자', data.metrics.users],
          ['곡 문서', data.metrics.firestoreSongs],
          ['셋리스트', data.metrics.firestoreSetlists],
          ['Storage 파일', data.metrics.storageFiles],
          ['Storage', formatBytes(data.metrics.storageBytes)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <p className="text-xs font-bold text-muted">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">사용자 관리</h2>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="p-2">이메일</th>
                <th>UID</th>
                <th>가입</th>
                <th>최근 로그인</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.uid} className="border-t border-line">
                  <td className="p-2 font-bold">{user.email ?? '—'}</td>
                  <td className="text-xs text-muted">{user.uid}</td>
                  <td>{user.createdAt}</td>
                  <td>{user.lastSignInAt}</td>
                  <td>
                    <button
                      className="rounded-lg border border-line px-3 py-2"
                      onClick={async () => {
                        await setAdminUserDisabled(user.uid, !user.disabled);
                        await reload();
                      }}
                    >
                      {user.disabled ? '활성화' : '비활성화'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <CatalogEditor title="태그 정규화" value={tags} onChange={setTags} />
        <CatalogEditor
          title="아티스트 정규화"
          value={artists}
          onChange={setArtists}
        />
        <button
          disabled={saving}
          onClick={() => void saveCatalog()}
          className="rounded-xl bg-ink px-5 py-3 font-bold text-white xl:col-span-2"
        >
          {saving ? '저장 중…' : '정규화 카탈로그 저장'}
        </button>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">관리자 감사 로그</h2>
        <div className="mt-4 space-y-2">
          {data.auditLogs.length ? (
            data.auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl bg-canvas p-3 text-sm">
                <b>{log.action}</b>
                <span className="ml-3 text-muted">
                  {log.target} · {log.actorEmail}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">기록된 관리자 작업이 없습니다.</p>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">월간 증가 비용 계산기</h2>
        <p className="mt-2 text-sm text-muted">
          공식 청구서가 아닌 수정 가능한 단가 기반 추정치입니다. 리전·무료
          할당량·작업 유형에 따라 달라집니다.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <NumberField
            label="Storage 증가(GB)"
            value={growthGb}
            onChange={setGrowthGb}
          />
          <NumberField
            label="다운로드(GB)"
            value={egressGb}
            onChange={setEgressGb}
          />
          <NumberField label="읽기 횟수" value={reads} onChange={setReads} />
          <NumberField label="쓰기 횟수" value={writes} onChange={setWrites} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <RateField
            label="Storage $/GB"
            value={rates.storage}
            onChange={(storage) => setRates({ ...rates, storage })}
          />
          <RateField
            label="Egress $/GB"
            value={rates.egress}
            onChange={(egress) => setRates({ ...rates, egress })}
          />
          <RateField
            label="Reads $/100k"
            value={rates.reads}
            onChange={(readsRate) => setRates({ ...rates, reads: readsRate })}
          />
          <RateField
            label="Writes $/100k"
            value={rates.writes}
            onChange={(writesRate) =>
              setRates({ ...rates, writes: writesRate })
            }
          />
        </div>
        <p className="mt-6 text-3xl font-black">
          예상 증가액 ${estimate.toFixed(2)} / month
        </p>
      </section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <b>운영 체크 권장:</b> 카탈로그 변경 이력, 관리자 감사 로그, Storage
        수명주기 정책, 일별 비용 알림, 사용자 데이터 내보내기/삭제 요청을
        정기적으로 확인하세요.
      </section>
    </div>
  );
}

function CatalogEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-line bg-white p-5">
      <span className="text-lg font-bold">{title}</span>
      <textarea
        className="mt-3 h-96 w-full rounded-xl bg-canvas p-4 font-mono text-xs outline-none"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-xs font-bold text-muted">
      {label}
      <input
        type="number"
        className="mt-2 w-full rounded-xl border border-line p-3 text-ink"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
const RateField = NumberField;
function formatBytes(bytes: number) {
  return bytes < 1024 ** 3
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
