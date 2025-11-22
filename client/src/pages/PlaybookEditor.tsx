/**
 * Playbook Editor Page
 * Editor completo de playbooks com rich text
 */
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, ArrowLeft, FileUp, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlaybooks } from "@/hooks/usePlaybooks";

export default function PlaybookEditor() {
  const [, params] = useRoute("/playbooks/:id/edit");
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { playbooks, createPlaybook, updatePlaybook } = usePlaybooks();

  const isNew = params?.id === "new";
  const existingPlaybook = isNew ? null : playbooks.find(p => p.id === params?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("onboarding");
  const [version, setVersion] = useState("1.0");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados do playbook existente
  useEffect(() => {
    if (existingPlaybook) {
      setTitle(existingPlaybook.name);
      setDescription(existingPlaybook.description || "");
      setCategory(existingPlaybook.category || "onboarding");
      setVersion(existingPlaybook.version || "1.0");
      setTags(existingPlaybook.tags?.join(", ") || "");
      setContent(existingPlaybook.content || "");
    }
  }, [params?.id]); // Changed from existingPlaybook to params?.id

  // Upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        toast.success("Arquivo carregado com sucesso!");
      };
      reader.readAsText(file);
    }
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!content) {
      toast.error("Conteúdo é obrigatório");
      return;
    }

    setIsSaving(true);
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    try {
      if (isNew) {
        // Criar novo playbook
        const newPlaybook = await createPlaybook({
          name: title,
          description,
          category,
          version,
          tags: tagsArray,
          content,
          author: currentUser?.email || "Unknown",
          is_active: true,
        });
        if (newPlaybook) {
          toast.success("Playbook criado com sucesso!");
          setLocation("/playbooks");
        }
      } else if (existingPlaybook) {
        // Atualizar playbook existente
        await updatePlaybook(existingPlaybook.id, {
          name: title,
          description,
          category,
          version,
          tags: tagsArray,
          content,
        });
        toast.success("Playbook atualizado com sucesso!");
        setLocation("/playbooks");
      }
    } catch (error) {
      toast.error("Erro ao salvar playbook");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.html`;
    a.click();
    toast.success("Playbook exportado!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/playbooks")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? "Novo Playbook" : "Editar Playbook"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie documentação completa com formatação rica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {isPreview ? "Editar" : "Visualizar"}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!content}>
            Exportar HTML
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Playbook"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <Card className="p-6">
        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="metadata">Metadados</TabsTrigger>
            <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título do Playbook *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Processo de Onboarding"
                  className="text-2xl font-bold"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição Breve</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Resumo do que este playbook cobre..."
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <Label className="mb-4 block">Conteúdo do Playbook *</Label>
              {isPreview ? (
                <div className="border border-border rounded-lg p-6 bg-muted">
                  <h1 className="text-3xl font-bold mb-4">{title || "Título do Playbook"}</h1>
                  {description && (
                    <p className="text-muted-foreground mb-6">{description}</p>
                  )}
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                </div>
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => {
                    console.log("Content changed:", e.target.value);
                    setContent(e.target.value);
                  }}
                  placeholder="Comece a escrever seu playbook... Suporta HTML e Markdown."
                  rows={20}
                  className="font-mono text-sm"
                  disabled={false}
                  readOnly={false}
                />
              )}
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💡 Dicas de Uso:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Você pode escrever HTML ou Markdown diretamente</li>
                <li>• Use o botão "Visualizar" para ver como ficará</li>
                <li>• Clique em "Exportar HTML" para baixar o arquivo</li>
                <li>• Use títulos (# H1, ## H2, ### H3) para organizar</li>
                <li>• Adicione links: [texto](url)</li>
              </ul>
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="renewal">Renovação</SelectItem>
                    <SelectItem value="expansion">Expansão</SelectItem>
                    <SelectItem value="support">Suporte</SelectItem>
                    <SelectItem value="training">Treinamento</SelectItem>
                    <SelectItem value="best-practices">Melhores Práticas</SelectItem>
                    <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ex: onboarding, setup, inicial"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={currentUser?.email || ""}
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Upload de Arquivo Existente
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Faça upload de um arquivo HTML, Markdown ou texto para importar
              </p>
              <input
                type="file"
                accept=".html,.md,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                  Selecionar Arquivo
                </Button>
              </label>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Formatos Suportados:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>HTML</strong> - Arquivo HTML completo</li>
                <li>• <strong>Markdown</strong> (.md) - Será convertido para HTML</li>
                <li>• <strong>Texto</strong> (.txt) - Texto simples</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
