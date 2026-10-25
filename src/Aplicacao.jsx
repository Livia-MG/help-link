import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { CatalogoProvider } from "./componentes/CatalogoProvider";
import { PrivacidadeProvider } from "./componentes/PrivacidadeProvider";
import Inicio from './paginas/Inicio';
import Sobre from './paginas/Sobre';
import Instituicoes from './paginas/Instituicoes';
import DetalhesOng from './paginas/DetalhesOng';
import Explorar from './paginas/Explorar';
import Contato from './paginas/Contato';
import Sos from './paginas/SOS';
import NaoEncontrado from './paginas/NaoEncontrado';

const Administracao = lazy(() => import("./paginas/admin/Administracao"));
const SolicitarOng = lazy(() => import("./paginas/SolicitarOng"));
const DocumentoLegal = lazy(() => import("./paginas/DocumentoLegal"));

function Aplicacao() {

  return (
    <BrowserRouter>
      <PrivacidadeProvider>
      <CatalogoProvider>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/termos-de-uso" element={<Suspense fallback={<p role="status" className="p-12">Carregando termos...</p>}><DocumentoLegal tipo="termos" /></Suspense>} />
        <Route path="/politica-de-privacidade" element={<Suspense fallback={<p role="status" className="p-12">Carregando política...</p>}><DocumentoLegal tipo="privacidade" /></Suspense>} />
        <Route path="/politica-de-cookies" element={<Suspense fallback={<p role="status" className="p-12">Carregando política...</p>}><DocumentoLegal tipo="cookies" /></Suspense>} />
        <Route path="/solicitar-instituicao" element={<Suspense fallback={<p role="status" className="p-12 text-center">Carregando formulário...</p>}><SolicitarOng /></Suspense>} />
        <Route path="/admin/*" element={<Suspense fallback={<p role="status" className="p-12 text-center">Carregando administração...</p>}><Administracao /></Suspense>} />
        <Route path="/" element={<Inicio />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/instituicoes" element={<Instituicoes />} />
        <Route path="/instituicoes/:id" element={<DetalhesOng />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/sos" element={<Sos />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
      </CatalogoProvider>
      </PrivacidadeProvider>
    </BrowserRouter>
  )
}

export default Aplicacao
