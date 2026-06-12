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

  // cropper
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processingCrop, setProcessingCrop] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error("Imagem muito grande (máx. 8MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(f);
  };

  const handleConfirmCrop = async () => {
    if (!rawImage || !croppedArea) return;
    setProcessingCrop(true);
    try {
      const dataUrl = await cropToDataUrl(rawImage, croppedArea);
      setPhotoURL(dataUrl);
      setRawImage(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao recortar imagem.");
    } finally { setProcessingCrop(false); }
  };

  const handleRemovePhoto = () => setPhotoURL("");

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
              <button
                type="button"
                onClick={handlePickFile}
                className="group relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 overflow-hidden flex items-center justify-center shrink-0 hover:border-primary transition-colors"
                title="Trocar foto"
              >
                {photoURL
                  ? <img src={photoURL} alt="foto de perfil" className="w-full h-full object-cover" />
                  : <UserIcon className="w-10 h-10 text-primary" />}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="dn" className="text-xs text-muted-foreground">Nome do admin (exibição)</Label>
                <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-black/40 border-primary/20" />
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handlePickFile} className="border-primary/30 text-primary hover:bg-primary/10">
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    {photoURL ? "Trocar foto" : "Adicionar foto"}
                  </Button>
                  {photoURL && (
                    <Button type="button" size="sm" variant="ghost" onClick={handleRemovePhoto} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />


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
