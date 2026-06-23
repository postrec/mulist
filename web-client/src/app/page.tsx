'use client';
import { AuthScreen } from '@/features/auth/auth-screen';
import { useAuth } from '@/features/auth/use-auth';
import { Dashboard } from '@/components/dashboard';

export default function Home() {
 const {user,loading,signIn,signUp,signOut}=useAuth();
 if(loading)return <main className="grid min-h-screen place-items-center bg-ink text-white"><span className="text-sm font-bold tracking-[.2em]">MULIST</span></main>;
 return user?<Dashboard user={user} onSignOut={signOut}/>:<AuthScreen onSignIn={signIn} onSignUp={signUp}/>;
}
