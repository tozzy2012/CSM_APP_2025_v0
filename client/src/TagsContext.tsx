/**
 * Tags Context
 * Contexto global para gerenciamento de tags
 */
import { createContext, useContext, ReactNode } from "react";
import { useTags } from "@/hooks/useTags";
import type { Tag } from "@/hooks/useTags";

export type { Tag };

interface TagsContextType {
  tags: Tag[];
  createTag: (tag: Omit<Tag, "id" | "createdAt">) => Tag;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  getTag: (id: string) => Tag | undefined;
  getTagsByCategory: (category: Tag["category"]) => Tag[];
  getTagsByIds: (ids: string[]) => Tag[];
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export function TagsProvider({ children }: { children: ReactNode }) {
  const tagsHook = useTags();

  return (
    <TagsContext.Provider value={tagsHook}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTagsContext() {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error("useTagsContext must be used within TagsProvider");
  }
  return context;
}
