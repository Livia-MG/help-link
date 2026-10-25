export async function consultarApi(caminho, signal) {
  const resposta = await fetch(caminho, { signal });
  const corpo = await resposta.json();
  if (!resposta.ok || !corpo.ok) {
    const erro = new Error(corpo.message || "Não foi possível carregar os dados.");
    erro.status = resposta.status;
    throw erro;
  }
  return corpo.data;
}
