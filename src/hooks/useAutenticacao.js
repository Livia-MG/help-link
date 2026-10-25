import { createContext, useContext } from "react";

export const ContextoAutenticacao = createContext(null);
export function useAutenticacao() {
  return useContext(ContextoAutenticacao);
}
