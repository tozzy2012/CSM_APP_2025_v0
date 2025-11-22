/**
 * OnboardingSettings Component
 * Configuração de etapas do checklist de onboarding
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, RotateCcw, GripVertical } from "lucide-react";

// Template padrão de onboarding
const DEFAULT_TEMPLATE = [
  { id: 1, title: "Kick-off Meeting", category: "Setup", order: 1 },
  { id: 2, title: "Configuração Inicial da Conta", category: "Setup", order: 2 },
  { id: 3, title: "Integração com Sistemas Existentes", category: "Integration", order: 3 },
  { id: 4, title: "Treinamento da Equipe - Básico", category: "Training", order: 4 },
  { id: 5, title: "Treinamento da Equipe - Avançado", category: "Training", order: 5 },
  { id: 6, title: "Configuração de Usuários e Permissões", category: "Setup", order: 6 },
  { id: 7, title: "Importação de Dados Históricos", category: "Integration", order: 7 },
  { id: 8, title: "Testes e Validação", category: "Adoption", order: 8 },
  { id: 9, title: "Go-Live e Lançamento", category: "Adoption", order: 9 },
  { id: 10, title: "Primeira Revisão de Sucesso", category: "Adoption", order: 10 },
];

const CATEGORIES = [
  { value: "Setup", label: "Configuração" },
  { value: "Training", label: "Treinamento" },
  { value: "Integration", label: "Integração" },
  { value: "Adoption", label: "Adoção" },
];

interface OnboardingTask {
  id: number;
  title: string;
  category: string;
  order: number;
}

export default function OnboardingSettings() {
  const [tasks, setTasks] = useState<OnboardingTask[]>(DEFAULT_TEMPLATE);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Setup");

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error("Digite um título para a etapa");
      return;
    }

    const newTask: OnboardingTask = {
      id: Date.now(),
      title: newTaskTitle,
      category: newTaskCategory,
      order: tasks.length + 1,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    toast.success("Etapa adicionada!");
  };

  const handleRemoveTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast.success("Etapa removida!");
  };

  const handleUpdateTask = (id: number, field: keyof OnboardingTask, value: string | number) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newTasks = [...tasks];
    [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]];
    // Atualizar order
    newTasks.forEach((task, idx) => {
      task.order = idx + 1;
    });
    setTasks(newTasks);
  };

  const handleMoveDown = (index: number) => {
    if (index === tasks.length - 1) return;
    const newTasks = [...tasks];
    [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    // Atualizar order
    newTasks.forEach((task, idx) => {
      task.order = idx + 1;
    });
    setTasks(newTasks);
  };

  const handleReset = () => {
    setTasks(DEFAULT_TEMPLATE);
    toast.success("Template restaurado para o padrão!");
  };

  const handleSave = () => {
    // Salvar no localStorage
    localStorage.setItem("onboardingTemplate", JSON.stringify(tasks));
    toast.success("Template de onboarding salvo!");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Configuração de Onboarding</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize as etapas do checklist de onboarding
          </p>
        </div>

        {/* Adicionar Nova Etapa */}
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">Adicionar Nova Etapa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="mb-2 block">Título da Etapa</Label>
              <Input
                placeholder="Ex: Configuração de API"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
              />
            </div>
            <div>
              <Label className="mb-2 block">Categoria</Label>
              <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddTask} className="mt-4" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Etapa
          </Button>
        </div>

        <Separator className="my-6" />

        {/* Lista de Etapas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Etapas do Checklist ({tasks.length})</h3>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma etapa configurada</p>
              <p className="text-sm">Adicione etapas acima ou restaure o template padrão</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === tasks.length - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  {/* Order */}
                  <span className="text-sm font-semibold text-muted-foreground min-w-[30px]">
                    {task.order}.
                  </span>

                  {/* Title */}
                  <div className="flex-1">
                    <Input
                      value={task.title}
                      onChange={(e) => handleUpdateTask(task.id, "title", e.target.value)}
                      className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                    />
                  </div>

                  {/* Category */}
                  <Select
                    value={task.category}
                    onValueChange={(value) => handleUpdateTask(task.id, "category", value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Template Padrão
          </Button>
          <Button onClick={handleSave}>
            Salvar Configurações
          </Button>
        </div>
      </Card>
    </div>
  );
}
