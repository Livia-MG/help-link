export function formatarTelefone(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length < 3) return `(${digitos}`;
  const numero = digitos.slice(2);
  const separacao = numero.length > 8 ? 5 : 4;
  return `(${digitos.slice(0, 2)}) ${numero.slice(0, separacao)}${numero.length > separacao ? `-${numero.slice(separacao)}` : ""}`;
}
