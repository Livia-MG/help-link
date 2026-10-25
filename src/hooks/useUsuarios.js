import { useEffect, useState } from "react";
import { consultarAdministrativo } from "../servicos/servicoAdministrativo";

export function useUsuarios() {
  const [versao, setVersao] = useState(0);
  const [resultado, setResultado] = useState(null);
  useEffect(() => {
    const controle = new AbortController();
    consultarAdministrativo("/api/usuarios", { signal: controle.signal })
      .then((dados) => { if (!controle.signal.aborted) setResultado({ versao, dados }); })
      .catch((erro) => { if (!controle.signal.aborted) setResultado({ versao, erro }); });
    return () => controle.abort();
  }, [versao]);
  const carregando = resultado?.versao !== versao;
  return { usuarios: carregando ? [] : resultado?.dados || [], erro: carregando ? null : resultado?.erro, carregando, recarregar: () => setVersao((atual) => atual + 1) };
}
