import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User as UserIcon, Lock, Loader2, Camera, ZoomIn, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adminUserId: string;
}

const DEFAULT_MIN = 120;
const MIN_VAL = 15;
const MAX_VAL = 720;
const OUTPUT_SIZE = 512; // px — alta nitidez

// Recorta a imagem na área selecionada e devolve um JPEG nítido em data URL
async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

export const SettingsModal = ({ open, onOpenChange, adminUserId }: Props) => {
  const [user, setUser] = useLocalStorage<any>("nytzer-user", null);

  // workspace
  const [threshold, setThreshold] = useState<string>(String(DEFAULT_MIN));
  const [loadingWs, setLoadingWs] = useState(false);
  const [savingWs, setSavingWs] = useState(false);

  // account
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [savingAcc, setSavingAcc] = useState(false);

  // password
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a]/95 border-primary/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            Configurações
          </DialogTitle>
          <DialogDescription>
            Gerencie sua conta e o workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="conta" className="w-full">
          <TabsList className="grid grid-cols-2 bg-black/40 border border-primary/15">
            <TabsTrigger value="conta"><UserIcon className="w-3.5 h-3.5 mr-1.5" />Conta</TabsTrigger>
            <TabsTrigger value="workspace"><Clock className="w-3.5 h-3.5 mr-1.5" />Workspace</TabsTrigger>
          </TabsList>

          {/* ───── CONTA ───── */}
          <TabsContent value="conta" className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 overflow-hidden flex items-center justify-center shrink-0">
                {photoURL
                  ? <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                  : <UserIcon className="w-8 h-8 text-primary" />}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="dn" className="text-xs text-muted-foreground">Nome do admin (exibição)</Label>
                <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-black/40 border-primary/20" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Escolha seu avatar</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((url) => {
                  const selected = photoURL === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoURL(url)}
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${
                        selected
                          ? "border-primary ring-2 ring-primary/40 scale-105"
                          : "border-primary/15 hover:border-primary/40"
                      }`}
                      title="Selecionar avatar"
                    >
                      <img src={url} alt="avatar" className="w-full h-full object-cover bg-black/40" />
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
