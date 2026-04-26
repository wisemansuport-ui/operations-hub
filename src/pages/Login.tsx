import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'sonner';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [, setUserData] = useLocalStorage<any>('nytzer-user', null);
  const navigate = useNavigate();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Preencha os dados de acesso');
      return;
    }
    
    // Fake Auth
    setUserData({
      username: username,
      role: 'OPERADOR', // Padrao
      token: Math.random().toString(36).substring(2, 10),
      createdAt: new Date().toISOString()
    });
    
    toast.success('Bem-vindo de volta, ' + username + '!');
    navigate('/production'); // ou pra onde quer que redirecione
  };

  const handleGoogleLogin = () => {
    // Fake Google SSO
    const pop = prompt("Integração Google SSO Simulada. Qual é o seu e-mail do Gmail?");
    if (pop) {
       const user = pop.split('@')[0];
       setUserData({
        username: user,
        role: 'OPERADOR',
        token: Math.random().toString(36).substring(2, 10),
        method: 'Google SSO'
      });
      toast.success('Logado via Google com sucesso!');
      navigate('/production');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden text-foreground">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[80px] -z-10" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Opera<span className="text-primary">Manage</span></h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium tracing-wide">Autenticação do Painel</p>
        </div>

        <div className="glass-card rounded-[24px] border border-border/50 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="flex bg-muted/30 p-1 rounded-xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-primary/20 text-primary shadow-inner border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Fazer Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-primary/20 text-primary shadow-inner border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Usuário / ID</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Insira seu identificador..."
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner transition-colors"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-[0_5px_20px_hsl(var(--primary)/0.25)] mt-2"
            >
              {isLogin ? 'Entrar no painel' : 'Criar minha conta'} 
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative flex items-center justify-center mt-6">
             <div className="absolute w-full border-t border-border/40" />
             <span className="bg-card px-3 text-[10px] text-muted-foreground font-bold tracking-widest uppercase relative z-10">OU</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full mt-6 bg-background border border-border/50 hover:bg-muted text-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-sm text-sm"
          >
            <Mail className="w-4 h-4 text-rose-400" />
            Continuar com Gmail
          </button>

          <p className="text-[10px] text-center text-muted-foreground mt-8 mx-auto max-w-[250px] font-medium leading-relaxed flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3 flex-shrink-0" /> Restrito para operadores autorizados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
