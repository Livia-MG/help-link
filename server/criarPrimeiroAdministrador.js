import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { obterSupabaseAdministrativo } from "./supabase.js";
import { criarUsuario } from "./servicoUsuarios.js";
import { ErroApi } from "./servicoAutenticacao.js";

let ocultar = false;
const saida = new Writable({ write(texto, _encoding, concluir) { if (!ocultar) process.stdout.write(texto); concluir(); } });
const perguntas = createInterface({ input: process.stdin, output: saida, terminal: Boolean(process.stdin.isTTY) });
try {
  const { data, error } = await obterSupabaseAdministrativo().from("usuarios").select("id").limit(1);
  if (error) throw new ErroApi(503, "Aplique a migration administrativa e confira a chave do servidor antes de continuar.");
  if (data.length) throw new ErroApi(409, "Já existe um administrador. Crie os próximos usuários pelo painel.");
  if (!process.stdin.isTTY) throw new ErroApi(400, "Execute este comando em um terminal interativo para informar a senha com segurança.");
  const nome = await perguntas.question("Nome: ");
  const email = await perguntas.question("E-mail: ");
  process.stdout.write("Senha (mínimo 8 caracteres, entrada oculta): ");
  ocultar = true;
  const senha = await perguntas.question("");
  ocultar = false;
  process.stdout.write("\n");
  await criarUsuario({ nome, email, senha });
  console.log("Administrador criado. Entre em /admin/login.");
} catch (erro) {
  // Evita imprimir objetos de erro do provedor contendo dados de credenciais.
  console.error(erro.status ? erro.message : "Não foi possível criar o administrador. Confira a configuração, a migration e se o e-mail já foi utilizado.");
  process.exitCode = 1;
} finally { ocultar = false; perguntas.close(); }
