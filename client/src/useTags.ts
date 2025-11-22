/**
 * useTags Hook
 * Gerenciamento de tags com localStorage
 */
import { useState, useEffect } from "react";

export interface Tag {
  id: string;
  name: string;
  color: string;
  category: "activity" | "task" | "playbook" | "account";
  icon?: string;
  createdAt: string;
}

const STORAGE_KEY = "zapper_tags";

// Tags padrão do sistema
const defaultTags: Tag[] = [
  // Activity tags
  { id: "1", name: "Urgente", color: "#ef4444", category: "activity", createdAt: new Date().toISOString() },
  { id: "2", name: "Follow-up", color: "#f59e0b", category: "activity", createdAt: new Date().toISOString() },
  { id: "3", name: "Onboarding", color: "#10b981", category: "activity", createdAt: new Date().toISOString() },
  
  // Task tags
  { id: "4", name: "Bug", color: "#ef4444", category: "task", createdAt: new Date().toISOString() },
  { id: "5", name: "Feature", color: "#3b82f6", category: "task", createdAt: new Date().toISOString() },
  { id: "6", name: "Documentação", color: "#8b5cf6", category: "task", createdAt: new Date().toISOString() },
  
  // Playbook tags
  { id: "7", name: "Onboarding", color: "#10b981", category: "playbook", createdAt: new Date().toISOString() },
  { id: "8", name: "Renewal", color: "#3b82f6", category: "playbook", createdAt: new Date().toISOString() },
  { id: "9", name: "Churn Prevention", color: "#ef4444", category: "playbook", createdAt: new Date().toISOString() },
  
  // Account tags
  { id: "10", name: "Enterprise", color: "#8b5cf6", category: "account", createdAt: new Date().toISOString() },
  { id: "11", name: "Strategic", color: "#f59e0b", category: "account", createdAt: new Date().toISOString() },
  { id: "12", name: "At Risk", color: "#ef4444", category: "account", createdAt: new Date().toISOString() },
];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);

  // Carregar tags do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTags(JSON.parse(stored));
    } else {
      // Inicializar com tags padrão
      setTags(defaultTags);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTags));
    }
  }, []);

  // Salvar tags no localStorage
  const saveTags = (newTags: Tag[]) => {
    setTags(newTags);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
  };

  // Criar tag
  const createTag = (tag: Omit<Tag, "id" | "createdAt">) => {
    const newTag: Tag = {
      ...tag,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    saveTags([...tags, newTag]);
    return newTag;
  };

  // Atualizar tag
  const updateTag = (id: string, updates: Partial<Tag>) => {
    const updated = tags.map((tag) =>
      tag.id === id ? { ...tag, ...updates } : tag
    );
    saveTags(updated);
  };

  // Excluir tag
  const deleteTag = (id: string) => {
    saveTags(tags.filter((tag) => tag.id !== id));
  };

  // Obter tag por ID
  const getTag = (id: string) => {
    return tags.find((tag) => tag.id === id);
  };

  // Obter tags por categoria
  const getTagsByCategory = (category: Tag["category"]) => {
    return tags.filter((tag) => tag.category === category);
  };

  // Obter tags por IDs
  const getTagsByIds = (ids: string[]) => {
    return tags.filter((tag) => ids.includes(tag.id));
  };

  return {
    tags,
    createTag,
    updateTag,
    deleteTag,
    getTag,
    getTagsByCategory,
    getTagsByIds,
  };
}
