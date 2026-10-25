import { useEffect, useState } from "react";
import { consultarApi } from "../servicos/servicoConsulta";

export function useConsulta(caminho) {
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState(null);
  const carregando = resultado?.caminho !== caminho || resultado?.tentativa !== tentativa;

  useEffect(() => {
    const controle = new AbortController();
    consultarApi(caminho, controle.signal)
      .then((dados) => {
        if (!controle.signal.aborted) setResultado({ caminho, tentativa, dados });
      })
      .catch((erro) => {
        if (!controle.signal.aborted) setResultado({ caminho, tentativa, erro });
      });
    return () => controle.abort();
  }, [caminho, tentativa]);

  return {
    dados: carregando ? undefined : resultado?.dados,
    erro: carregando ? undefined : resultado?.erro,
    carregando,
    tentarNovamente: () => setTentativa((valor) => valor + 1),
  };
}
