import React, { createContext, useContext } from "react";
type T = Record<string, unknown>;
const Ctx = createContext<T>({});
export const OrganizationsProvider = ({ children }: { children: React.ReactNode }) => (
  <Ctx.Provider value={{}}>{children}</Ctx.Provider>
);
export const useOrganizations = () => useContext(Ctx);
export default Ctx;
