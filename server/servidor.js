import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { handleContactPayload } from "./servicoContato.js";
import { rotaConsultarOng, rotaListarCategorias, rotaListarOngs } from "./rotasConsulta.js";
import { rotaMeuPerfil, rotaUsuario, rotaUsuarios } from "./rotasAdministrativas.js";
import { rotaSolicitacao, rotaSolicitacoes, rotaReenviarSolicitacao } from "./rotasSolicitacoes.js";

const app = express();
const port = Number(process.env.PORT || 3001);

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      ok: false,
      message: "Muitas tentativas. Tente novamente em alguns minutos.",
    });
  },
});

app.use(cors());
app.use(express.json({ limit: "128kb" }));
app.use((error, _req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ ok: false, message: "Os dados enviados excedem o tamanho permitido." });
  }
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      ok: false,
      message: "Os dados enviados estao em um formato invalido.",
    });
  }

  return next(error);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.all("/api/ongs", rotaListarOngs);
app.all("/api/ongs/:id", rotaConsultarOng);
app.all("/api/categorias", rotaListarCategorias);
app.all("/api/usuarios", rotaUsuarios);
app.all("/api/usuarios/:id", rotaUsuario);
app.all("/api/autenticacao/me", rotaMeuPerfil);
app.all("/api/solicitacoes", rotaSolicitacoes);
app.all("/api/solicitacoes/:id", rotaSolicitacao);
app.all("/api/solicitacoes/:id/reenviar", rotaReenviarSolicitacao);

app.post("/api/contato", contactLimiter, async (req, res) => {
  const result = await handleContactPayload(req.body);
  return res.status(result.status).json(result.body);
});

app.listen(port, () => {
  console.log(`Servidor Help Link rodando em http://localhost:${port}`);
});
