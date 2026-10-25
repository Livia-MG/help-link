import { Siren, PawPrint, User, Phone, MapPin, AlertCircle } from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";

const options = [
  {
    icon: PawPrint,
    title: "Ajuda para animais",
    desc: "Resgate de animais feridos, abandonados ou em risco.",
    phone: "199",
    label: "Defesa Civil",
  },
  {
    icon: User,
    title: "Ajuda para pessoas",
    desc: "Pessoas em situação de rua, vulnerabilidade ou risco imediato.",
    phone: "193",
    label: "Bombeiros",
  },
];

const SOS = () => (
  <Estrutura>
    <section className="bg-gradient-destructive text-destructive-foreground">
      <div className="container py-14 text-center max-w-3xl">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 mb-5">
          <Siren className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold">Emergência S.O.S</h1>
        <p className="mt-3 text-lg text-destructive-foreground/90">
          Escolha o tipo de ajuda. Vamos conectar você ao serviço certo agora.
        </p>
      </div>
    </section>

    <section className="container -mt-10 pb-12">
      <div className="bg-card border-2 border-destructive/20 rounded-2xl p-4 flex items-start gap-3 shadow-destructive max-w-3xl mx-auto">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          Em risco de vida imediato, ligue <strong className="text-destructive">190</strong> (Polícia) ou{" "}
          <strong className="text-destructive">192</strong> (SAMU).
        </p>
      </div>
    </section>

    <section className="container pb-20 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {options.map((o) => (
        <div key={o.title} className="bg-card rounded-3xl border border-border shadow-card p-8 flex flex-col">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive-soft text-destructive mb-5">
            <o.icon className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold">{o.title}</h2>
          <p className="mt-2 text-muted-foreground flex-1">{o.desc}</p>

          <div className="mt-6 space-y-3">
            <a
              href={`tel:${o.phone}`}
              className="w-full inline-flex items-center justify-center gap-2 h-14 px-7 rounded-xl text-base font-semibold text-white bg-destructive hover:opacity-95 transition"
            >
              <Phone className="h-5 w-5" />
              Ligar agora · {o.phone}
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://www.google.com/maps/search/ong+resgate+barretos"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition"
            >
              <MapPin className="h-5 w-5" />
              Ver localização
            </a>
            <p className="text-center text-xs text-muted-foreground">{o.label}</p>
          </div>
        </div>
      ))}
    </section>
  </Estrutura>
);

export default SOS;
