import { Navigate, Route, Routes } from "react-router-dom";
import { AutenticacaoProvider } from "../../componentes/admin/AutenticacaoProvider";
import { EstruturaAdmin } from "../../componentes/admin/EstruturaAdmin";
import Login from "./Login";
import RedefinirSenha from "./RedefinirSenha";
import { InstituicoesAdmin, UsuariosAdmin } from "./Cadastros";
import Solicitacoes from "./Solicitacoes";

export default function Administracao() {
  return <AutenticacaoProvider><Routes>
    <Route path="login" element={<Login />} />
    <Route path="redefinir-senha" element={<RedefinirSenha />} />
    <Route element={<EstruturaAdmin />}>
      <Route index element={<Navigate to="instituicoes" replace />} />
      <Route path="instituicoes" element={<InstituicoesAdmin />} />
      <Route path="usuarios" element={<UsuariosAdmin />} />
      <Route path="solicitacoes" element={<Solicitacoes />} />
      <Route path="*" element={<Navigate to="/admin/instituicoes" replace />} />
    </Route>
  </Routes></AutenticacaoProvider>;
}
