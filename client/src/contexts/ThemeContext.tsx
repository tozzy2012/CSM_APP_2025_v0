import React, { createContext, useContext } from "react";
const ThemeContext = createContext({ theme: "light" });
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{ theme: "light" }}>{children}</ThemeContext.Provider>
);
export const useTheme = () => useContext(ThemeContext);
