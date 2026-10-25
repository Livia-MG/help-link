import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowRight,
  BadgeCheck,
  HandHeart,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";
import { useCatalogo } from "../hooks/useCatalogo";
import { EstadoConsulta } from "../componentes/EstadoConsulta";
import { cn } from "../lib/utilitarios";
import { MapaComPrivacidade } from "../componentes/MapaComPrivacidade";

const BARRETOS_CENTER = [-20.557, -48.567];

const categoryColors = {
  animais: "#f97316",
  saude: "#ef4444",
  alimentos: "#eab308",
  idosos: "#8b5cf6",
  criancas: "#2563eb",
  pessoas: "#16a34a",
};

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const createPinIcon = (category, highlighted) => {
  const color = categoryColors[category] ?? categoryColors.pessoas;
  const size = highlighted ? 38 : 30;

  return divIcon({
    className: "help-link-map-pin",
    html: `
      <span style="
        width:${size}px;
        height:${size}px;
        background:${color};
        border:3px solid #fff;
        border-radius:9999px 9999px 9999px 0;
        box-shadow:0 12px 24px rgba(23,38,30,.24);
        display:block;
        transform:rotate(-45deg);
      ">
        <span style="
          width:8px;
          height:8px;
          background:#fff;
          border-radius:9999px;
          display:block;
          margin:${highlighted ? "12px" : "8px"};
        "></span>
      </span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const MapFocus = ({ selectedOng }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedOng) return;

    map.flyTo([selectedOng.coordinates.lat, selectedOng.coordinates.lng], 15, {
      duration: 0.7,
    });
  }, [map, selectedOng]);

  return null;
};

const OngMarker = ({ ong, highlighted, selected, onSelect }) => {
  const { categoryLabels } = useCatalogo();
  const markerRef = useRef(null);
  const mainCategory = ong.categories[0];

  useEffect(() => {
    if (selected) {
      markerRef.current?.openPopup();
    }
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      position={[ong.coordinates.lat, ong.coordinates.lng]}
      icon={createPinIcon(mainCategory, highlighted || selected)}
      eventHandlers={{ click: () => onSelect(ong.id) }}
    >
      <Popup>
        <div className="min-w-56 space-y-2">
          <div>
            <p className="font-semibold text-sm text-foreground">{ong.name}</p>
            <p className="text-xs text-muted-foreground">{categoryLabels[mainCategory]}</p>
          </div>
          <p className="text-xs text-muted-foreground">{ong.address}</p>
          <p className="text-xs font-medium text-foreground">{ong.phone}</p>
          <Link
            to={`/instituicoes/${ong.id}`}
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground! hover:opacity-90"
          >
            Ver detalhes
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};

const ExploreMap = ({ filteredOngs, hoveredId, selectedId, onSelect }) => {
  const selectedOng = filteredOngs.find((ong) => ong.id === selectedId);

  return (
    <div className="sticky top-20 h-[520px] overflow-hidden rounded-2xl border border-border bg-muted shadow-card lg:h-[calc(100vh-7rem)]">
      <MapaComPrivacidade>
      <MapContainer center={BARRETOS_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus selectedOng={selectedOng} />
        {filteredOngs.map((ong) => (
          <OngMarker
            key={ong.id}
            ong={ong}
            highlighted={hoveredId === ong.id}
            selected={selectedId === ong.id}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
      </MapaComPrivacidade>
    </div>
  );
};

const ExploreCard = ({ ong, selected, onHover, onLeave, onSelect }) => {
  const { categoryLabels } = useCatalogo();
  const mainCategory = ong.categories[0];
  const color = categoryColors[mainCategory] ?? categoryColors.pessoas;

  return (
    <article
      role="button"
      tabIndex={0}
      onMouseEnter={() => onHover(ong.id)}
      onMouseLeave={onLeave}
      onClick={() => onSelect(ong.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(ong.id);
        }
      }}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-card transition-base hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-primary",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
      )}
    >
      <div className="flex flex-col p-4 gap-4">
        <div className="h-36 overflow-hidden rounded-xl bg-muted sm:h-full">
          <img
            src={ong.image}
            alt={`Foto de ${ong.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {ong.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: categoryColors[category] ?? color }}
              >
                {categoryLabels[category]}
              </span>
            ))}
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold leading-snug">{ong.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {ong.neighborhood}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-primary" />
                {ong.phone}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{ong.address}</p>
          <p className="text-sm leading-relaxed text-foreground/80">{ong.shortDescription}</p>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Principais necessidades</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ong.needs.slice(0, 4).map((need) => (
                <span key={need} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                  {need}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <Link
              to={`/instituicoes/${ong.id}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={`/instituicoes/${ong.id}#como-ajudar`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <HandHeart className="h-4 w-4 text-primary" />
              Como ajudar
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const Explorar = () => {
  const { ongs, categorias, categoryLabels, carregando, erro, tentarNovamente } = useCatalogo();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [onlyVolunteers, setOnlyVolunteers] = useState(false);
  const [onlyCertificate, setOnlyCertificate] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const filteredOngs = useMemo(() => {
    const normalizedQuery = normalize(query);

    return ongs.filter((ong) => {
      const searchable = normalize(
        [
          ong.name,
          ong.shortDescription,
          ong.description,
          ong.neighborhood,
          ong.address,
          ...ong.needs,
          ...ong.categories.map((category) => categoryLabels[category]),
        ].join(" "),
      );

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesCategory = activeCategory === "all" || ong.categories.includes(activeCategory);
      const matchesVolunteers = !onlyVolunteers || ong.acceptsVolunteers;
      const matchesCertificate = !onlyCertificate || ong.issuesCertificate;

      return matchesQuery && matchesCategory && matchesVolunteers && matchesCertificate;
    });
  }, [ongs, categoryLabels, activeCategory, onlyCertificate, onlyVolunteers, query]);

  const hasFilters = query || activeCategory !== "all" || onlyVolunteers || onlyCertificate;

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setOnlyVolunteers(false);
    setOnlyCertificate(false);
    setSelectedId(null);
  };

  return (
    <Estrutura>
      <section className="border-b border-border bg-gradient-soft">
        <div className="container py-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-primary">Explorar</p>
              <h1 className="font-display text-3xl font-bold md:text-4xl">Explorar ONGs</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Encontre instituições cadastradas em Barretos, filtre por causa e veja cada ONG no mapa.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              <MapPin className="h-4 w-4 text-primary" />
              Barretos, SP
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar ONG por nome ou causa..."
                  className="h-12 w-full rounded-xl border border-border bg-background pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </span>
                <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={onlyVolunteers}
                    onChange={(event) => setOnlyVolunteers(event.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Aceita voluntários
                </label>
                <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={onlyCertificate}
                    onChange={(event) => setOnlyCertificate(event.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Emite certificado
                </label>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeCategory === "all"
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                Todas
              </button>
              {categorias.map(({ id: category }) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                    activeCategory === category
                      ? "border-transparent text-white shadow-sm"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                  style={activeCategory === category ? { backgroundColor: categoryColors[category] } : undefined}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: activeCategory === category ? "#fff" : categoryColors[category] }}
                  />
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <EstadoConsulta carregando={carregando} erro={erro} tentarNovamente={tentarNovamente} />
        {!carregando && !erro && <>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{filteredOngs.length}</strong>{" "}
                {filteredOngs.length === 1 ? "resultado encontrado" : "resultados encontrados"}
              </p>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Users className="h-4 w-4 text-primary" />
                ONGs cadastradas
              </div>
            </div>

            {filteredOngs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
                <BadgeCheck className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 font-display text-xl font-semibold">Nenhuma ONG encontrada</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ajuste os filtros ou limpe a busca para ver outras instituições no mapa.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-95"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOngs.map((ong) => (
                  <ExploreCard
                    key={ong.id}
                    ong={ong}
                    selected={selectedId === ong.id}
                    onHover={setHoveredId}
                    onLeave={() => setHoveredId(null)}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            )}
          </div>

          <ExploreMap
            filteredOngs={filteredOngs}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        </>}
      </section>
    </Estrutura>
  );
};

export default Explorar;
