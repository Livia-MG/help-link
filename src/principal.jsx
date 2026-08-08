import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos.css'
import Aplicacao from './Aplicacao.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Aplicacao />
  </StrictMode>,
)
