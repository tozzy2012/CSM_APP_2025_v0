import React, { createContext, useContext } from "react";
const PlaybooksContext = createContext({ playbooks: [] });
export const PlaybooksProvider = ({ children }: { children: React.ReactNode }) => (
  <PlaybooksContext.Provider value={{ playbooks: [] }}>{children}</PlaybooksContext.Provider>
);
export const usePlaybooksContext = () => useContext(PlaybooksContext);
