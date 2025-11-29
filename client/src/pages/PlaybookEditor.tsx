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
import { ArrowLeft, Save, Eye, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

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

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTopic, setGenerationTopic] = useState("");
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

  const funnyMessages = [
    "Consultando os oráculos de CS...",
    "Ligando para o Lincoln Murphy...",
    "Lendo todos os livros de Customer Success...",
    "Calculando o Health Score do universo...",
    "Evitando o Churn da sua paciência...",
    "Gerando estratégias de retenção infalíveis...",
    "Otimizando a experiência do usuário...",
    "Buscando inspiração nos melhores playbooks...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingProgress(0);
      let progress = 0;

      // Progress bar animation
      const progressInterval = setInterval(() => {
        progress += 1;
        if (progress > 90) clearInterval(progressInterval);
        setLoadingProgress(progress);
      }, 100);

      // Funny messages rotation
      setLoadingMessage(funnyMessages[0]);
      let msgIndex = 0;
      interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % funnyMessages.length;
        setLoadingMessage(funnyMessages[msgIndex]);
      }, 2000);

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    }
  }, [isGenerating]);

  const handleGeneratePlaybook = async () => {
    if (!generationTopic) {
      toast.error("Por favor, informe um tema para o playbook");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/v1/accounts/playbook/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: generationTopic,
          category: formData.category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao gerar playbook");
      }

      const data = await response.json();

      // Update form data with generated content
      setFormData(prev => ({
        ...prev,
        content: data.content,
        name: prev.name || generationTopic, // Use topic as name if empty
        description: prev.description || `Playbook gerado por IA sobre: ${generationTopic}`,
      }));

      setGenerationDialogOpen(false);
      toast.success("Playbook gerado com sucesso! 🚀");

    } catch (error) {
      console.error("Erro na geração:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar playbook");
    } finally {
      setIsGenerating(false);
      setLoadingProgress(100);
    }
  };

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

                {/* AI Generation Dialog Trigger */}
                <Button
                  variant="outline"
                  className="mt-4 w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 group"
                  onClick={() => setGenerationDialogOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500 group-hover:text-primary transition-colors" />
                  Help me write (IA)
                </Button>

                {/* AI Generation Dialog */}
                <Dialog open={generationDialogOpen} onOpenChange={setGenerationDialogOpen}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Gerador de Playbook com IA
                      </DialogTitle>
                      <DialogDescription>
                        Descreva o objetivo do playbook e nossa IA criará uma estrutura completa baseada nas melhores práticas de mercado.
                      </DialogDescription>
                    </DialogHeader>

                    {!isGenerating ? (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Sobre o que é este playbook?</Label>
                          <Input
                            placeholder="Ex: Onboarding para clientes Enterprise, Recuperação de Churn, QBR..."
                            value={generationTopic}
                            onChange={(e) => setGenerationTopic(e.target.value)}
                          />
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm text-blue-700 dark:text-blue-300">
                          💡 <strong>Dica:</strong> A IA usará a categoria selecionada ({formData.category}) para contextualizar o conteúdo.
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 space-y-6 text-center">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-75"></div>
                          <div className="relative flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full">
                            <Sparkles className="w-10 h-10 text-purple-600 animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-medium text-lg animate-pulse">{loadingMessage}</h3>
                          <Progress value={loadingProgress} className="w-full h-2" />
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      {!isGenerating && (
                        <Button onClick={handleGeneratePlaybook} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Playbook Mágico
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
