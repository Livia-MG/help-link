import { createContext, useContext } from "react";

export const ContextoCatalogo = createContext(null);

export function useCatalogo() {
  return useContext(ContextoCatalogo);
}
