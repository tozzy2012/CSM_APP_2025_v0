/**
 * Tags Management Component
 * Interface para gerenciar tags da plataforma
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Tag as TagIcon } from "lucide-react";
import { useTagsContext, type Tag } from "@/contexts/TagsContext";
import { toast } from "sonner";

const categoryLabels = {
  activity: "Atividades",
  task: "Tarefas",
  playbook: "Playbooks",
  account: "Contas",
};

const colorOptions = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f59e0b", label: "Laranja" },
  { value: "#eab308", label: "Amarelo" },
  { value: "#10b981", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#6b7280", label: "Cinza" },
];

export default function TagsManagement() {
  const { tags, createTag, updateTag, deleteTag } = useTagsContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    category: "activity" as Tag["category"],
  });

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        color: tag.color,
        category: tag.category,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: "",
        color: "#3b82f6",
        category: "activity",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }

    if (editingTag) {
      updateTag(editingTag.id, formData);
      toast.success("Tag atualizada com sucesso!");
    } else {
      createTag(formData);
      toast.success("Tag criada com sucesso!");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tag?")) {
      deleteTag(id);
      toast.success("Tag excluída com sucesso!");
    }
  };

  // Agrupar tags por categoria
  const groupedTags = {
    activity: tags.filter((t) => t.category === "activity"),
    task: tags.filter((t) => t.category === "task"),
    playbook: tags.filter((t) => t.category === "playbook"),
    account: tags.filter((t) => t.category === "account"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciamento de Tags</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie tags para categorizar atividades, tarefas, playbooks e contas
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {/* Tags por categoria */}
      {Object.entries(groupedTags).map(([category, categoryTags]) => (
        <Card key={category} className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="w-5 h-5" />
            <h4 className="font-semibold">
              {categoryLabels[category as Tag["category"]]}
            </h4>
            <Badge variant="secondary">{categoryTags.length}</Badge>
          </div>

          {categoryTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma tag cadastrada nesta categoria
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categoryTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border"
                  style={{ borderColor: tag.color }}
                >
                  <Badge
                    style={{
                      backgroundColor: tag.color,
                      color: "white",
                    }}
                  >
                    {tag.name}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => handleOpenDialog(tag)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Dialog de Criar/Editar Tag */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Editar Tag" : "Nova Tag"}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? "Atualize as informações da tag"
                : "Crie uma nova tag para categorizar seus itens"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Urgente, Follow-up, Bug..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: Tag["category"]) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">Atividades</SelectItem>
                  <SelectItem value="task">Tarefas</SelectItem>
                  <SelectItem value="playbook">Playbooks</SelectItem>
                  <SelectItem value="account">Contas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor *</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-10 rounded-md border-2 transition-all ${
                      formData.color === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() =>
                      setFormData({ ...formData, color: color.value })
                    }
                    title={color.label}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Cor selecionada: {colorOptions.find((c) => c.value === formData.color)?.label}
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: formData.color,
                    color: "white",
                  }}
                >
                  {formData.name || "Nome da tag"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  em {categoryLabels[formData.category]}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingTag ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
