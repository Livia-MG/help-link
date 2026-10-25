import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HandHeart, ArrowRight, Search } from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";
import { IconeLogo } from "../componentes/IconeLogo";
import { CartaoOng } from "../componentes/CartaoOng";
import { ongs } from "../dados/ongs";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop",
    title: "Toda ajuda começa com um clique.",
    desc: "Conectamos você às ONGs da região para doar, ser voluntário ou pedir ajuda em momentos de emergência.",
  },
  {
    image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2070&auto=format&fit=crop",
    title: "Educação transforma futuros.",
    desc: "Apoie projetos educacionais e ajude a construir um amanhã com mais oportunidades para nossas crianças.",
  },
  {
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop",
    title: "Acolhimento que salva vidas.",
    desc: "Encontre instituições de saúde e assistência social que precisam do seu apoio para continuar cuidando de quem precisa.",
  }
];

const features = [
  {
    icon: Search,
    title: "Encontrar ONGs",
    desc: "Busque instituições por categoria, localização e necessidade na sua região.",
    to: "/instituicoes",
    cta: "Explorar",
  },
  {
    icon: HandHeart,
    title: "Como ajudar",
    desc: "Descubra formas práticas de doar, voluntariar e gerar impacto real.",
    to: "/sobre",
    cta: "Saiba mais",
  }
];

const stats = [
  { n: "+10", l: "ONGs cadastradas" },
  { n: "+300", l: "Pessoas impactadas" },
  { n: "100%", l: "Gratuito" },
];

const Inicio = () => {
  const featured = ongs.slice(0, 3);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Estrutura>
      {/* HERO */}
      <section className="relative overflow-hidden h-[600px] md:h-[700px] flex items-center">
        {/* Background Slider */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className={`h-full w-full object-cover ${index === currentSlide ? "animate-fade-in-pure" : ""}`}
            />
            {/* Overlay */}
            {/* <div className="absolute inset-0 bg-radial from-primary/80 to-primary/20 mix-blend-multiply" /> */}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}

        {/* Conteúdo */}
        <div className="container mx-auto relative z-10 flex justify-center text-center">
          {heroSlides.map((slide, index) => (
             index === currentSlide && (
              <div key={index} className="max-w-2xl text-white">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] text-balance opacity-0 animate-fade-up [animation-delay:200ms]">
                  {slide.title}
                </h1>
                <p className="mt-5 mx-auto text-lg md:text-xl text-white/90 max-w-xl text-balance opacity-0 animate-fade-up [animation-delay:400ms]">
                  {slide.desc}
                </p>
              </div>
             )
          ))}
        </div>

        {/* Dots de navegação */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="container -mt-10 relative z-10">
        <div className="bg-card rounded-2xl shadow-card-hover border border-border grid grid-cols-1 sm:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
          {stats.map((s) => (
            <div key={s.l} className="p-6 text-center">
              <div className="font-display text-3xl font-bold text-primary">{s.n}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">O que você quer fazer hoje?</h2>
          <p className="mt-3 text-muted-foreground">Três caminhos simples para você começar agora mesmo.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className={`group relative bg-card rounded-2xl p-7 border transition-base hover:-translate-y-1 ${
                f.highlight
                  ? "border-destructive/40 hover:shadow-destructive bg-destructive-soft/40"
                  : "border-border shadow-card hover:shadow-card-hover"
              }`}
            >
              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl mb-5 ${
                  f.highlight ? "bg-gradient-sos text-sos-foreground" : "bg-gradient-primary text-primary-foreground"
                }`}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <span
                className={`inline-flex items-center gap-1.5 mt-5 text-sm font-medium ${
                  f.highlight ? "text-sos" : "text-primary"
                }`}
              >
                {f.cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED ONGS */}
      <section className="container py-12">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Instituições em destaque</h2>
            <p className="mt-2 text-muted-foreground">Conheça algumas das ONGs que fazem a diferença em Barretos.</p>
          </div>
          <Link
            to="/instituicoes"
            className="hidden sm:inline-flex items-center gap-2 h-10 px-5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((o) => <CartaoOng key={o.id} ong={o} />)}
        </div>
      </section>

      {/* IMPACT BANNER */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-14 text-primary-foreground shadow-glow">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="mb-4 grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
              <IconeLogo className="h-10 w-10 object-contain" />
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">
              Junte-se a centenas de barretenses que já fazem a diferença.
            </h2>
            <p className="mt-3 text-primary-foreground/90 text-lg">
              Cadastre-se para receber novidades das ONGs e oportunidades de voluntariado.
            </p>
            <Link
              to="/contato"
              className="mt-6 inline-flex items-center justify-center h-12 px-7 rounded-lg text-base font-semibold bg-white text-primary hover:bg-white/95 transition"
            >
              Quero participar
            </Link>
          </div>
        </div>
      </section>
    </Estrutura>
  );
};

export default Inicio;
