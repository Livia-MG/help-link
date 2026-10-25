import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { useCatalogo } from "../hooks/useCatalogo";

export const CartaoOng = ({ ong }) => {
  const { categoryLabels } = useCatalogo();
  return (
    <article className="group bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-base hover:-translate-y-1">
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={ong.image}
          alt={`Foto de ${ong.name}`}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {ong.categories.map((c) => (
            <div
              key={c}
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[var(--primary-soft)] text-[var(--primary)]"
            >
              {categoryLabels[c]}
            </div>
          ))}
        </div>
        <h3 className="font-display font-semibold text-lg leading-snug">{ong.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{ong.shortDescription}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {ong.neighborhood}
        </div>
        <Link
          to={`/instituicoes/${ong.id}`}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md text-sm font-medium bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary-soft)]/70 transition group"
        >
          Ver mais
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
};
