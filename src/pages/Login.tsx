import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight, ShieldCheck, Mail, Eye, EyeOff, User, Lock, Monitor, Smartphone, Users, Phone } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where, limit } from 'firebase/firestore';
import { registerDeviceTag } from '../lib/notifications';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [, setUserData] = useLocalStorage<any>('nytzer-user', null);
  const [, setGlobalRole] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'OPERADOR');
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setIsLogin(false);
      toast.info(`Você foi convidado por: ${ref}`);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Preencha os dados de acesso');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!isLogin) {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }
        if (!querySnapshot.empty) {
          toast.error('Usuário já existe. Faça login.');
          return;
        }
        if (!fullName.trim() || !phoneNumber.trim()) {
          toast.error('Preencha seu Nome e Celular para continuar.');
          return;
        }
      
        const ref = searchParams.get('ref');
        // Qualquer conta sem link de indicação (ref) vira ADMIN, com link vira OPERADOR
        const role = !ref ? 'ADMIN' : 'OPERADOR';
        
        const newUser = {
          username,
          password,
          fullName,
          teamName,
          phoneNumber,
          role, 
          affiliatedTo: ref || null,
          token: Math.random().toString(36).substring(2, 10),
          createdAt: new Date().toISOString()
        };
        
        await addDoc(usersRef, newUser);
        setUserData(newUser);
        setGlobalRole(role);
        // Tag this device in OneSignal immediately after account creation
        registerDeviceTag(username, role).catch(console.warn);
        toast.success('Conta criada com sucesso!');
        navigate('/');
      } else {
        if (querySnapshot.empty) {
          toast.error('Usuário não encontrado');
          return;
        }
        
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();

        if (user.password !== password) {
          toast.error('Senha incorreta');
          return;
        }
        
        const sessionUser = { ...user, id: userDoc.id, token: Math.random().toString(36).substring(2, 10) };
        setUserData(sessionUser);
        setGlobalRole(user.role || 'OPERADOR');
        // Tag this device in OneSignal immediately after login
        registerDeviceTag(username, user.role || 'OPERADOR').catch(console.warn);
        toast.success('Bem-vindo de volta, ' + username + '!');
        navigate('/');
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      if (error.code === 'permission-denied') {
        toast.error("O banco de dados está bloqueado. Libere as regras no Firebase.");
      } else if (error.code === 'not-found') {
         toast.error("O banco de dados Firestore não foi criado no projeto.");
      } else {
        toast.error("Ocorreu um erro ao conectar com o banco de dados.");
      }
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const usernameFromGoogle = userInfo.email.split('@')[0];
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("username", "==", usernameFromGoogle));
        const querySnapshot = await getDocs(q);

        let existingUser: any;

        if (querySnapshot.empty) {
           const ref = searchParams.get('ref');
           // Qualquer conta sem link de indicação (ref) vira ADMIN, com link vira OPERADOR
           const role = !ref ? 'ADMIN' : 'OPERADOR';
           
           existingUser = {
             username: usernameFromGoogle,
             password: Math.random().toString(36).slice(-8),
             fullName: userInfo.name || '',
             teamName: '',
             phoneNumber: '',
             role, 
             affiliatedTo: ref || null,
             token: Math.random().toString(36).substring(2, 10),
             createdAt: new Date().toISOString(),
             method: 'Google SSO'
           };
           
           const docRef = await addDoc(usersRef, existingUser);
           existingUser.id = docRef.id;
           toast.success('Conta criada via Google com sucesso!');
        } else {
           const userDoc = querySnapshot.docs[0];
           existingUser = { ...userDoc.data(), id: userDoc.id };
           toast.success('Bem-vindo de volta, ' + usernameFromGoogle + '!');
        }

        setUserData({ ...existingUser, token: Math.random().toString(36).substring(2, 10), method: 'Google SSO' });
        setGlobalRole(existingUser.role || 'OPERADOR');
        // Tag this device in OneSignal immediately after Google login
        registerDeviceTag(existingUser.username, existingUser.role || 'OPERADOR').catch(console.warn);
        navigate('/');
      } catch (err) {
        console.error("Erro no Google Login:", err);
        toast.error('Erro ao obter dados da conta Google');
      }
    },
    onError: () => toast.error('O login com Google foi cancelado ou falhou.')
  });

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden text-foreground p-4">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[80px] -z-10" />

      {/* Header outside card */}
      <div className="mb-6 text-center z-10 flex flex-col items-center">
        <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          NYTZER<span className="text-primary">VISION</span>
        </h1>
        <p className="text-[13px] text-muted-foreground font-medium tracking-wide mt-2">Sistema de Gestão Inteligente</p>
      </div>

      <div className="w-full max-w-[420px] z-10">
        <div className="bg-[#0A0A0B]/80 backdrop-blur-xl rounded-[24px] border border-primary/20 p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1.5">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
            <p className="text-sm text-muted-foreground">{isLogin ? 'Entre na sua conta para continuar' : 'Preencha os dados para registrar-se'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">E-mail ou Usuário</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="seu@email.com ou nome_usuario"
                  className="w-full bg-[#121214] border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  autoComplete="off"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Nome Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="João da Silva"
                      className="w-full bg-[#121214] border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">Nome da Equipe</label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                        placeholder="Equipe Alpha"
                        className="w-full bg-[#121214] border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">Número de Celular *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="11999999999"
                        className="w-full bg-[#121214] border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121214] border border-border/50 rounded-xl pl-10 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground block">Repetir Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121214] border border-border/50 rounded-xl pl-10 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <label className="flex items-center gap-2.5 mt-2 cursor-pointer group w-fit">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary' : 'border-border/60 group-hover:border-primary/50'}`}>
                  {rememberMe && <ShieldCheck className="w-3 h-3 text-primary-foreground" />}
                </div>
                <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Lembrar de mim neste dispositivo</span>
              </label>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-[0_5px_15px_hsl(var(--primary)/0.2)] mt-6"
            >
              {isLogin ? 'Entrar' : 'Criar Conta'} 
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative flex items-center justify-center mt-6 mb-6">
             <div className="absolute w-full border-t border-border/40" />
             <span className="bg-[#0A0A0B] px-3 text-[10px] text-muted-foreground font-bold tracking-widest uppercase relative z-10">OU</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-[#121214] border border-border/50 hover:bg-muted text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] text-sm"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-1">
               <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
            </div>
            Entrar com Google
          </button>

          {isLogin && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors">Esqueceu sua senha?</button>
              <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                 <Monitor className="w-4 h-4" /> Não consegue fazer login? Gerenciar sessões
              </button>
            </div>
          )}

          <div className="mt-8 text-center pt-6">
             <p className="text-sm text-muted-foreground">
               {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
               <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline">
                 {isLogin ? "Cadastre-se" : "Faça login"}
               </button>
             </p>
             
             <button type="button" className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mx-auto">
               <Smartphone className="w-4 h-4" /> Instalar app no celular
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
