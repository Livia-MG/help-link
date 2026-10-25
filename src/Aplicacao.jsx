import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";
import Inicio from './paginas/Inicio';
import Sobre from './paginas/Sobre';
import Instituicoes from './paginas/Instituicoes';
import DetalhesOng from './paginas/DetalhesOng';
import Explorar from './paginas/Explorar';
import Contato from './paginas/Contato';
import NaoEncontrado from './paginas/NaoEncontrado';

function Aplicacao() {

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/instituicoes" element={<Instituicoes />} />
        <Route path="/instituicoes/:id" element={<DetalhesOng />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Aplicacao
