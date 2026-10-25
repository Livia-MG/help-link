import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";
import Inicio from './paginas/Inicio';
import Sobre from './paginas/Sobre';
import NaoEncontrado from './paginas/NaoEncontrado';

function Aplicacao() {

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Aplicacao
