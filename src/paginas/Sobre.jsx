import { Estrutura } from "../componentes/Estrutura";
import { Heart, Gift, Users, Sparkles, Target, ShieldCheck } from "lucide-react";

const blocks = [
  { icon: Gift, title: "Doações", desc: "Conectamos doadores a ONGs que realmente precisam, com transparência sobre cada necessidade." },
  { icon: Users, title: "Voluntariado", desc: "Encontre causas que combinam com você e doe seu tempo para transformar realidades." },
  { icon: Heart, title: "Impacto social", desc: "Toda contribuição é monitorada para garantir que chegue a quem mais precisa." },
];

const values = [
  { icon: Sparkles, title: "Acessível", desc: "Interface simples para qualquer pessoa, em qualquer dispositivo." },
  { icon: Target, title: "Direto ao ponto", desc: "Encontre ajuda ou ofereça ajuda em poucos cliques." },
  { icon: ShieldCheck, title: "Confiável", desc: "Todas as ONGs passam por verificação antes de entrar na plataforma." },
];

const Sobre = () => (
  <Estrutura>
    <section className="bg-gradient-soft border-b border-border">
      <div className="container py-20 text-center max-w-3xl">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-sm font-medium mb-5">
          Sobre o Help Link
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight text-balance">
          Tecnologia a serviço da solidariedade.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground text-balance">
          O Help Link nasceu em Barretos para encurtar o caminho entre quem quer ajudar e quem precisa de ajuda.
          Acreditamos que pequenas ações, organizadas em rede, transformam comunidades inteiras.
        </p>
      </div>
    </section>

    <section className="container py-20">
      <h2 className="font-display text-3xl font-bold text-center mb-12">Como nos movemos</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {blocks.map((b) => (
          <div key={b.title} className="bg-card rounded-2xl p-8 border border-border shadow-card hover:shadow-card-hover transition-base">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary mb-5">
              <b.icon className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{b.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="container pb-20">
      <div className="bg-secondary/40 rounded-3xl p-10 md:p-14">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Nossos valores</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((v) => (
            <div key={v.title} className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-card border border-border text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Estrutura>
);

export default Sobre;
