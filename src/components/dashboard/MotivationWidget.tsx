import { useEffect, useState } from "react";
import { Quote, Sparkles } from "lucide-react";

const QUOTES: { text: string; author: string }[] = [
  { text: "Disciplina pesa gramas, arrependimento pesa toneladas.", author: "Jim Rohn" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Não conte os dias, faça os dias contarem.", author: "Muhammad Ali" },
  { text: "Grandes coisas nunca vêm da zona de conforto.", author: "Roy T. Bennett" },
  { text: "A persistência realiza o impossível.", author: "Provérbio Chinês" },
  { text: "Você é o que você faz repetidamente. Excelência é um hábito.", author: "Aristóteles" },
  { text: "O preço do sucesso é trabalho duro e dedicação ao trabalho em mãos.", author: "Vince Lombardi" },
  { text: "Se você quer algo que nunca teve, faça algo que nunca fez.", author: "Thomas Jefferson" },
  { text: "A sorte favorece a mente preparada.", author: "Louis Pasteur" },
  { text: "Sonhe grande. Comece pequeno. Aja agora.", author: "Robin Sharma" },
  { text: "Não espere por oportunidades, crie-as.", author: "George Bernard Shaw" },
  { text: "Cada dia é uma nova chance de virar o jogo.", author: "Nytzervision" },
  { text: "Dinheiro segue valor. Construa valor antes de cobrar resultado.", author: "Naval Ravikant" },
  { text: "Foco vence talento quando talento não foca.", author: "Tim Notke" },
  { text: "Trabalhe enquanto eles dormem. Aprenda enquanto eles se divertem.", author: "Anônimo" },
];

export const MotivationWidget = () => {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((p) => (p + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[idx];

  return (
    <div className="hairline-gold surface-3 rounded-2xl p-5 md:p-6 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/80">Motivação Diária</p>
          <h3 className="text-sm font-bold text-foreground">Combustível para a operação</h3>
        </div>
      </div>

      <div key={idx} className="animate-fade-in relative z-10">
        <Quote className="w-6 h-6 text-primary/40 mb-2" />
        <p className="text-base md:text-lg font-semibold text-foreground leading-relaxed tracking-tight">
          {q.text}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
          <span className="text-[11px] uppercase tracking-widest font-semibold text-primary/70">— {q.author}</span>
        </div>
      </div>

      <div className="flex gap-1 mt-5 relative z-10">
        {QUOTES.slice(0, 6).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i === idx % 6 ? "bg-primary" : "bg-primary/15"}`}
          />
        ))}
      </div>
    </div>
  );
};
