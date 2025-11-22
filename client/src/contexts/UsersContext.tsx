import React, { createContext, useContext } from "react";
type T = Record<string, unknown>;
const Ctx = createContext<T>({});
export const UsersProvider = ({ children }: { children: React.ReactNode }) => (
  <Ctx.Provider value={{}}>{children}</Ctx.Provider>
);
export const useUsers = () => useContext(Ctx);
export default Ctx;
