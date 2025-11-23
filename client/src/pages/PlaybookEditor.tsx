import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePlaybooksContext } from "@/contexts/PlaybooksContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlaybookEditorProps {
  id?: string; // Se fornecido, modo de edição
}

export default function PlaybookEditor({ id }: PlaybookEditorProps) {
  const [location, setLocation] = useLocation();
  const { getPlaybook, createPlaybook, updatePlaybook } = usePlaybooksContext();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "sales",
    content: "",
    tags: [] as string[],
    version: "1.0",
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      loadPlaybook(id);
    }
  }, [id]);

  const loadPlaybook = async (playbookId: string) => {
    setLoading(true);
    try {
      const playbook = await getPlaybook(playbookId);
      if (playbook) {
        setFormData({
          name: playbook.name,
          description: playbook.description,
          category: playbook.category,
          content: playbook.content,
          tags: playbook.tags,
          version: playbook.version,
          is_active: playbook.is_active,
        });
      } else {
        toast.error("Playbook não encontrado");
        setLocation("/playbooks");
      }
    } catch (error) {
      toast.error("Erro ao carregar playbook");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.content) {
      toast.error("Nome e conteúdo são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      if (id) {
        // Update
        // Simple version bump logic
        const nextVersion = (parseFloat(formData.version) + 0.1).toFixed(1);

        await updatePlaybook(id, {
          ...formData,
          version: nextVersion,
        });
        toast.success(`Playbook atualizado para versão ${nextVersion}`);
      } else {
        // Create
        await createPlaybook({
          ...formData,
          author: "Current User", // Backend will overwrite if using auth
          is_active: true,
        });
        toast.success("Playbook criado com sucesso");
      }
      setLocation("/playbooks");
    } catch (error) {
      toast.error("Erro ao salvar playbook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/playbooks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {id ? "Editar Playbook" : "Novo Playbook"}
          </h1>
          {id && (
            <Badge variant="outline" className="text-lg">
              v{formData.version}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/playbooks")}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Playbook"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Playbook</CardTitle>
              <CardDescription>
                Escreva o conteúdo detalhado do playbook usando o editor abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Título do Playbook</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Processo de Onboarding Enterprise"
                  className="text-lg font-medium"
                />
              </div>

              <div className="mt-6">
                <Label className="mb-2 block">Conteúdo</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Comece a escrever seu playbook aqui..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="cs">Customer Success</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="support">Suporte</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição Curta</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Uma breve descrição do objetivo deste playbook..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={formData.tags.join(", ")}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()) })}
                  placeholder="Ex: onboarding, enterprise, qbr"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Ativo</Label>
                  <div className="text-sm text-muted-foreground">
                    Visível para a equipe
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
