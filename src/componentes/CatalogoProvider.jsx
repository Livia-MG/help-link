import { useMemo } from "react";
import { ContextoCatalogo } from "../hooks/useCatalogo";
import { useConsulta } from "../hooks/useConsulta";

const listaVazia = [];

export function CatalogoProvider({ children }) {
  const consultaOngs = useConsulta("/api/ongs");
  const consultaCategorias = useConsulta("/api/categorias");
  const categorias = consultaCategorias.dados ?? listaVazia;
  const categoryLabels = useMemo(
    () => Object.fromEntries(categorias.map(({ id, nome }) => [id, nome])),
    [categorias],
  );

  return (
    <ContextoCatalogo.Provider value={{
      ongs: consultaOngs.dados ?? listaVazia,
      categorias,
      categoryLabels,
      carregando: consultaOngs.carregando || consultaCategorias.carregando,
      erro: consultaOngs.erro || consultaCategorias.erro,
      tentarNovamente: () => {
        consultaOngs.tentarNovamente();
        consultaCategorias.tentarNovamente();
      },
    }}>
      {children}
    </ContextoCatalogo.Provider>
  );
}
