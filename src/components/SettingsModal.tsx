import { useEffect, useRef, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User as UserIcon, Lock, Megaphone, Camera, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { calculateProfitSummary } from "@/lib/profitSummary";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adminUserId: string;
}

const DEFAULT_MIN = 120;
const MIN_VAL = 15;
const MAX_VAL = 720;

type Period = "daily" | "weekly" | "monthly" | "7d" | "30d";

const PERIOD_OPTS: { value: Period; label: string }[] = [
  { value: "daily",   label: "Hoje (diário)" },
  { value: "weekly",  label: "Esta semana" },
  { value: "monthly", label: "Este mês" },
  { value: "7d",      label: "Últimos 7 dias" },
  { value: "30d",     label: "Últimos 30 dias" },
];

async function resizeToDataURL(file: File, max = 320): Promise<string> {
  const img = document.createElement("img");
  const reader = new FileReader();
  const dataUrl: string = await new Promise((res, rej) => {
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = dataUrl;
  });
  const ratio = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export const SettingsModal = ({ open, onOpenChange, adminUserId }: Props) => {
  const [user, setUser] = useLocalStorage<any>("nytzer-user", null);
  const { metas, users, costs, loading: loadingData } = useFirestoreData();

  // workspace
  const [threshold, setThreshold] = useState<string>(String(DEFAULT_MIN));
  const [loadingWs, setLoadingWs] = useState(false);
  const [savingWs, setSavingWs] = useState(false);

  // account
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [savingAcc, setSavingAcc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // password
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  // manual notification
  const [period, setPeriod] = useState<Period>("daily");
  const [firing, setFiring] = useState(false);

  useEffect(() => {
    if (!open || !adminUserId) return;
    setLoadingWs(true);
    getDoc(doc(db, "users", adminUserId))
      .then((snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as any;
        const v = d.inactiveThresholdMinutes;
        setThreshold(String(typeof v === "number" && v > 0 ? v : DEFAULT_MIN));
        setDisplayName(d.fullName || d.displayName || "");
        setPhotoURL(d.photoURL || "");
      })
      .catch(() => setThreshold(String(DEFAULT_MIN)))
      .finally(() => setLoadingWs(false));
  }, [open, adminUserId]);

  const handleSaveWorkspace = async () => {
    const n = parseInt(threshold, 10);
    if (isNaN(n) || n < MIN_VAL || n > MAX_VAL) {
      toast.error(`Valor deve ser entre ${MIN_VAL} e ${MAX_VAL} minutos.`);
      return;
    }
    setSavingWs(true);
    try {
      await updateDoc(doc(db, "users", adminUserId), { inactiveThresholdMinutes: n });
      toast.success("Workspace atualizado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar.");
    } finally { setSavingWs(false); }
  };

  const handlePhotoPick = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem máx 5MB."); return; }
    try {
      const dataUrl = await resizeToDataURL(file, 320);
      setPhotoURL(dataUrl);
      toast.success("Foto pronta — clique em Salvar.");
    } catch { toast.error("Falha ao processar imagem."); }
  };

  const handleSaveAccount = async () => {
    if (!displayName.trim()) { toast.error("Nome obrigatório."); return; }
    setSavingAcc(true);
    try {
      await updateDoc(doc(db, "users", adminUserId), {
        fullName: displayName.trim(),
        photoURL: photoURL || null,
      });
      setUser({ ...(user || {}), fullName: displayName.trim(), photoURL: photoURL || null });
      toast.success("Conta atualizada!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar conta.");
    } finally { setSavingAcc(false); }
  };

  const handleChangePassword = async () => {
    if (!curPwd || !newPwd || !confirmPwd) { toast.error("Preencha todos os campos."); return; }
    if (newPwd !== confirmPwd) { toast.error("Nova senha e confirmação não batem."); return; }
    if (newPwd.length < 4) { toast.error("Senha muito curta."); return; }
    setSavingPwd(true);
    try {
      const snap = await getDoc(doc(db, "users", adminUserId));
      const cur = (snap.data() as any)?.password;
      if (cur !== curPwd) { toast.error("Senha atual incorreta."); setSavingPwd(false); return; }
      await updateDoc(doc(db, "users", adminUserId), { password: newPwd });
      setUser({ ...(user || {}), password: newPwd });
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      toast.success("Senha alterada!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao trocar senha.");
    } finally { setSavingPwd(false); }
  };

  const handleFire = async () => {
    if (!user?.username) { toast.error("Sem usuário logado."); return; }
    if (loadingData) { toast.info("Carregando dados da operação. Tente novamente em instantes."); return; }
    const localSummary = calculateProfitSummary({ period, adminUsername: user.username, metas, users, costs });
    setFiring(true);
    toast.loading("Disparando notificação...", { id: "fire-notif" });
    try {
      const { data, error } = await supabase.functions.invoke("send-profit-summary", {
        body: { period, targetAdmin: user.username, allowZero: true, localSummary },
      });
      toast.dismiss("fire-notif");
      if (error) throw new Error(error.message || "Erro ao invocar função");
      if ((data as any)?.fallback) {
        const raw = (data as any).error || "Serviço temporariamente indisponível.";
        const message = /firestore|quota|limite/i.test(raw)
          ? "Lucro ainda não sincronizado no banco. Aguarde a próxima atualização automática e tente novamente."
          : raw;
        toast.warning(message);
        return;
      }
      const count = (data as any)?.count ?? (Array.isArray((data as any)?.results) ? (data as any).results.length : 0);
      if (count > 0) toast.success("✅ Notificação enviada!");
      else toast.info("Função executada, mas nenhum envio realizado.");
    } catch (e: any) {
      toast.dismiss("fire-notif");
      console.error(e);
      toast.error("Falha ao disparar: " + (e?.message || e));
    } finally { setFiring(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a]/95 border-primary/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            Configurações
          </DialogTitle>
          <DialogDescription>
            Gerencie sua conta, o workspace e dispare notificações.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="conta" className="w-full">
          <TabsList className="grid grid-cols-3 bg-black/40 border border-primary/15">
            <TabsTrigger value="conta"><UserIcon className="w-3.5 h-3.5 mr-1.5" />Conta</TabsTrigger>
            <TabsTrigger value="workspace"><Clock className="w-3.5 h-3.5 mr-1.5" />Workspace</TabsTrigger>
            <TabsTrigger value="disparo"><Megaphone className="w-3.5 h-3.5 mr-1.5" />Disparo</TabsTrigger>
          </TabsList>

          {/* ───── CONTA ───── */}
          <TabsContent value="conta" className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 overflow-hidden flex items-center justify-center">
                  {photoURL
                    ? <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                    : <UserIcon className="w-8 h-8 text-primary" />}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90"
                  title="Trocar foto"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handlePhotoPick(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="dn" className="text-xs text-muted-foreground">Nome do admin (exibição)</Label>
                <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-black/40 border-primary/20" />
              </div>
            </div>

            <Button onClick={handleSaveAccount} disabled={savingAcc || loadingWs} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
              {savingAcc ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar perfil
            </Button>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Lock className="w-4 h-4 text-primary" /> Alterar senha
              </div>
              <Input type="password" placeholder="Senha atual" value={curPwd} onChange={e => setCurPwd(e.target.value)} className="bg-black/40 border-primary/20" />
              <Input type="password" placeholder="Nova senha" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="bg-black/40 border-primary/20" />
              <Input type="password" placeholder="Confirmar nova senha" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="bg-black/40 border-primary/20" />
              <Button onClick={handleChangePassword} disabled={savingPwd} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                {savingPwd ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Trocar senha
              </Button>
            </div>
          </TabsContent>

          {/* ───── WORKSPACE ───── */}
          <TabsContent value="workspace" className="space-y-3 pt-4">
            <Label htmlFor="th" className="text-sm">Alertar operador sumido após (minutos)</Label>
            <Input
              id="th" type="number" min={MIN_VAL} max={MAX_VAL}
              value={threshold} disabled={loadingWs}
              onChange={(e) => setThreshold(e.target.value)}
              className="bg-black/40 border-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">
              Entre {MIN_VAL} e {MAX_VAL} min. Padrão: {DEFAULT_MIN} (2h). O anti-spam reusa o mesmo intervalo por meta.
            </p>
            <Button onClick={handleSaveWorkspace} disabled={savingWs || loadingWs} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
              {savingWs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar workspace
            </Button>
          </TabsContent>

          {/* ───── DISPARO ───── */}
          <TabsContent value="disparo" className="space-y-3 pt-4">
            <Label className="text-sm">Período</Label>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                    period === opt.value
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "bg-black/30 border-primary/15 text-muted-foreground hover:text-foreground"
                  }`}
                >{opt.label}</button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Calcula o lucro do período em tempo real, aplica o tom de voz adequado (negativo / até R$ 500 / até R$ 1.500 / acima) e envia push + alerta no sino. Mensal e 30 dias incluem o % da sua meta mensal de objetivo.
            </p>
            <Button onClick={handleFire} disabled={firing} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
              {firing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Disparar agora
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
