import { createContext, useContext } from "react";

export const ContextoPrivacidade = createContext(null);
export function usePrivacidade() {
  return useContext(ContextoPrivacidade);
}
