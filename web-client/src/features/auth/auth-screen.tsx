'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Music2 } from 'lucide-react';

interface Props { onSignIn:(email:string,password:string)=>Promise<unknown>; onSignUp:(email:string,password:string)=>Promise<unknown>; }
export function AuthScreen({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e:FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await (mode === 'login' ? onSignIn(email,password) : onSignUp(email,password)); } catch (reason) { const code = reason instanceof Error ? reason.message : ''; setError(code.includes('invalid-credential') ? '이메일 또는 비밀번호를 확인해 주세요.' : code.includes('email-already') ? '이미 사용 중인 이메일입니다.' : '로그인할 수 없습니다. 입력 내용을 확인해 주세요.'); } finally { setBusy(false); } }
  return <main className="min-h-screen bg-ink text-white lg:grid lg:grid-cols-[1.1fr_.9fr]">
    <section className="relative hidden overflow-hidden p-14 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-lime/20 blur-3xl" />
      <Logo light />
      <div className="relative max-w-xl animate-rise"><p className="mb-5 text-sm font-bold uppercase tracking-[.22em] text-lime">Music library, reimagined</p><h1 className="text-6xl font-semibold leading-[1.04] tracking-[-.05em]">Your music.<br/>Ready when<br/>you are.</h1><p className="mt-7 max-w-md text-lg leading-8 text-white/55">PDF 악보를 곡 중심으로 정리하고, 모든 기기에서 같은 라이브러리를 만나보세요.</p></div>
      <div className="flex gap-8 text-sm text-white/55"><span className="flex items-center gap-2"><Check size={16} className="text-lime"/>실시간 동기화</span><span className="flex items-center gap-2"><Check size={16} className="text-lime"/>Song Package</span></div>
    </section>
    <section className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10 text-ink">
      <div className="w-full max-w-md animate-rise"><div className="mb-12 lg:hidden"><Logo /></div><p className="text-sm font-bold uppercase tracking-[.18em] text-muted">Welcome to MuList</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.04em]">{mode === 'login' ? '다시 만나 반가워요.' : '라이브러리를 시작하세요.'}</h2><p className="mt-3 text-muted">{mode === 'login' ? '내 악보 라이브러리로 계속합니다.' : '계정 하나로 iPad와 바로 동기화됩니다.'}</p>
        <form onSubmit={submit} className="mt-10 space-y-5"><Field label="이메일" type="email" value={email} onChange={setEmail} placeholder="you@example.com"/><Field label="비밀번호" type="password" value={password} onChange={setPassword} placeholder="6자 이상"/>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-bold text-white transition hover:bg-black disabled:opacity-50">{busy ? '잠시만요…' : mode === 'login' ? '로그인' : '계정 만들기'}<ArrowRight size={18}/></button></form>
        <p className="mt-7 text-center text-sm text-muted">{mode === 'login' ? 'MuList가 처음인가요?' : '이미 계정이 있나요?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}} className="font-bold text-ink underline underline-offset-4">{mode === 'login' ? '회원가입' : '로그인'}</button></p>
      </div>
    </section>
  </main>;
}
function Field({label,type,value,onChange,placeholder}:{label:string;type:string;value:string;onChange:(v:string)=>void;placeholder:string}) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><input required minLength={type==='password'?6:undefined} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-line bg-white px-4 py-4 outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/5"/></label>; }
function Logo({light=false}:{light?:boolean}) { return <div className={`flex items-center gap-3 text-xl font-black tracking-[-.03em] ${light?'text-white':'text-ink'}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><Music2 size={21}/></span>MuList</div>; }
