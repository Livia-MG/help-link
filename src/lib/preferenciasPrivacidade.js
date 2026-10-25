export const COOKIE_PRIVACIDADE = "help_link_privacidade";
export const VERSAO_PRIVACIDADE = 1;
export const DURACAO_PREFERENCIAS = 180 * 24 * 60 * 60;

export function lerPreferencias(cookies = document.cookie, agora = Date.now()) {
  try {
    const valor = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_PRIVACIDADE}=`));
    if (!valor) return null;
    const dados = JSON.parse(decodeURIComponent(valor.slice(COOKIE_PRIVACIDADE.length + 1)));
    if (dados.versao !== VERSAO_PRIVACIDADE || typeof dados.mapas !== "boolean" || !Number.isFinite(dados.atualizadoEm)) return null;
    if (dados.atualizadoEm > agora || agora - dados.atualizadoEm >= DURACAO_PREFERENCIAS * 1000) return null;
    return dados;
  } catch { return null; }
}

export function salvarPreferencias(mapas) {
  const dados = { versao: VERSAO_PRIVACIDADE, mapas: Boolean(mapas), atualizadoEm: Date.now() };
  let armazenado = false;
  try {
    document.cookie = `${COOKIE_PRIVACIDADE}=${encodeURIComponent(JSON.stringify(dados))}; Path=/; Max-Age=${DURACAO_PREFERENCIAS}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    armazenado = lerPreferencias()?.atualizadoEm === dados.atualizadoEm;
  } catch { /* A escolha ainda pode ser respeitada em memoria. */ }
  return { dados, armazenado };
}
