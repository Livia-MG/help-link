import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Estrutura } from "../componentes/Estrutura";
import { CartaoOng } from "../componentes/CartaoOng";
import { ongs, categoryLabels } from "../dados/ongs";

const Instituicoes = () => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [neighborhood, setNeighborhood] = useState("all");

  const neighborhoods = useMemo(
    () => ["all", ...Array.from(new Set(ongs.map((o) => o.neighborhood)))],
    []
  );

  const filtered = ongs.filter((o) => {
    const q = query.toLowerCase();

    const matchQ =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.shortDescription.toLowerCase().includes(q);

    const matchC = active === "all" || o.categories.includes(active);
    const matchN = neighborhood === "all" || o.neighborhood === neighborhood;

    return matchQ && matchC && matchN;
  });

  const cats = ["all", ...Object.keys(categoryLabels)];

  return (
    <Estrutura>
      <section className="bg-gradient-soft border-b border-border">
        <div className="container py-14">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Encontre uma instituição
          </h1>
          <p className="mt-2 text-muted-foreground">
            Busque ONGs por nome, categoria ou bairro em Barretos.
          </p>

          <div className="mt-7 bg-card rounded-2xl shadow-card border border-border p-3 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou causa..."
                className="flex w-full h-12 pl-12 rounded-md border border-border bg-transparent px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground ml-2" />

              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-12 rounded-lg border border-border bg-background px-3 text-sm font-medium"
              >
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n === "all" ? "Todos os bairros" : n}
                  </option>
                ))}
              </select>

              {(query || active !== "all" || neighborhood !== "all") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setActive("all");
                    setNeighborhood("all");
                  }}
                  className="inline-flex items-center gap-2 h-9 px-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  active === c
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {c === "all" ? "Todas" : categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12">
        <p className="text-sm text-muted-foreground mb-6">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "instituição encontrada"
            : "instituições encontradas"}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Nenhuma instituição encontrada com esses filtros.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((o) => (
              <CartaoOng key={o.id} ong={o} />
            ))}
          </div>
        )}
      </section>
    </Estrutura>
  );
};

export default Instituicoes;
