import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Navigation, HandHeart, Check } from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";
import { useCatalogo } from "../hooks/useCatalogo";
import { useConsulta } from "../hooks/useConsulta";
import { EstadoConsulta } from "../componentes/EstadoConsulta";
import { MapaComPrivacidade } from "../componentes/MapaComPrivacidade";

const DetalhesOng = () => {
  const { id } = useParams();
  const catalogo = useCatalogo();
  const { categoryLabels } = catalogo;
  const consulta = useConsulta(`/api/ongs/${encodeURIComponent(id)}`);
  const ong = consulta.dados;
  const carregando = consulta.carregando || catalogo.carregando;
  const erro = consulta.erro || catalogo.erro;

  if (carregando || (erro && erro.status !== 404)) {
    return (
      <Estrutura>
        <div className="container py-12">
          <EstadoConsulta carregando={carregando} erro={erro} tentarNovamente={() => {
            consulta.tentarNovamente();
            if (catalogo.erro) catalogo.tentarNovamente();
          }} />
        </div>
      </Estrutura>
    );
  }

  if (!ong) {
    return (
      <Estrutura>
        <div className="container py-32 text-center">
          <h1 className="font-display text-2xl font-bold">Instituição não encontrada</h1>
          <Link
            to="/instituicoes"
            className="inline-flex items-center justify-center mt-6 h-10 px-5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Voltar
          </Link>
        </div>
      </Estrutura>
    );
  }

  const mapsQuery = encodeURIComponent(ong.address);

  return (
    <Estrutura>
      <div className="container pt-6">
        <Link
          to="/instituicoes"
          className="inline-flex items-center gap-2 h-9 px-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas as instituições
        </Link>
      </div>

      <section className="container pt-4 pb-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video rounded-3xl overflow-hidden border border-border shadow-card">
            <img src={ong.image} alt={ong.name} className="h-full w-full object-cover" />
          </div>

          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ong.categories.map((c) => (
                <div key={c} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary-soft text-primary">
                  {categoryLabels[c]}
                </div>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">{ong.name}</h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{ong.description}</p>
          </div>

          <div id="como-ajudar" className="scroll-mt-24 bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-primary" /> Como ajudar
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {ong.needs.map((n) => (
                <li key={n} className="flex items-center gap-2 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4 sticky top-24">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Endereço</div>
                <div className="text-sm font-medium">{ong.address}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</div>
                <div className="text-sm font-medium">{ong.phone}</div>
              </div>
            </div>

            <div className="aspect-video rounded-xl overflow-hidden border border-border">
              <MapaComPrivacidade>
              <iframe
                title={`Mapa de ${ong.name}`}
                src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
                className="h-full w-full"
                loading="lazy"
              />
              </MapaComPrivacidade>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${ong.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                <Phone className="h-4 w-4" />
                Ligar
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition"
              >
                <Navigation className="h-4 w-4" />
                Rotas
              </a>
            </div>
            <button
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md text-sm font-semibold text-white bg-primary hover:opacity-95 transition"
            >
              <HandHeart className="h-4 w-4" />
              Quero ajudar
            </button>
          </div>
        </aside>
      </section>
    </Estrutura>
  );
};

export default DetalhesOng;
