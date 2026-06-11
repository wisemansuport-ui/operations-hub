import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  adminUserId: string;
}

const DEFAULT_MIN = 120;
const MIN_VAL = 15;
const MAX_VAL = 720;

export const SettingsModal = ({ open, onOpenChange, adminUserId }: Props) => {
  const [value, setValue] = useState<string>(String(DEFAULT_MIN));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !adminUserId) return;
    setLoading(true);
    getDoc(doc(db, "users", adminUserId))
      .then((snap) => {
        const v = snap.exists() ? (snap.data() as any).inactiveThresholdMinutes : null;
        setValue(String(typeof v === "number" && v > 0 ? v : DEFAULT_MIN));
      })
      .catch(() => setValue(String(DEFAULT_MIN)))
      .finally(() => setLoading(false));
  }, [open, adminUserId]);

  const handleSave = async () => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < MIN_VAL || n > MAX_VAL) {
      toast.error(`Valor deve ser entre ${MIN_VAL} e ${MAX_VAL} minutos.`);
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", adminUserId), { inactiveThresholdMinutes: n });
      toast.success("Configuração salva!");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a]/95 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Configurações do Workspace
          </DialogTitle>
          <DialogDescription>
            Ajuste os parâmetros de alerta para os operadores deste workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="inactive-threshold" className="text-sm">
            Alertar operador sumido após (minutos)
          </Label>
          <Input
            id="inactive-threshold"
            type="number"
            min={MIN_VAL}
            max={MAX_VAL}
            value={value}
            disabled={loading}
            onChange={(e) => setValue(e.target.value)}
            className="bg-black/40 border-primary/20"
          />
          <p className="text-[11px] text-muted-foreground">
            Entre {MIN_VAL} e {MAX_VAL} min. Padrão: {DEFAULT_MIN} (2h). O anti-spam reusa o mesmo intervalo por meta.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
