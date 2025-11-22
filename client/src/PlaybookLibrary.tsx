/**
 * Playbook Library / Wiki Page
 * Biblioteca de playbooks com busca e categorização
 */
import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Calendar,
  User,
  Eye,
  Edit,
  Download,
} from "lucide-react";
import { usePlaybooksContext } from "@/contexts/PlaybooksContext";

export default function PlaybookLibrary() {
  const { playbooks } = usePlaybooksContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredPlaybooks = playbooks.filter((playbook) => {
    const matchesSearch =
      playbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playbook.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playbook.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      categoryFilter === "all" || playbook.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      onboarding: "Onboarding",
      renewal: "Renovação",
      expansion: "Expansão",
      support: "Suporte",
      training: "Treinamento",
      "best-practices": "Melhores Práticas",
      troubleshooting: "Troubleshooting",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      onboarding: "bg-blue-100 text-blue-800",
      renewal: "bg-green-100 text-green-800",
      expansion: "bg-purple-100 text-purple-800",
      support: "bg-orange-100 text-orange-800",
      training: "bg-indigo-100 text-indigo-800",
      "best-practices": "bg-pink-100 text-pink-800",
      troubleshooting: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Playbooks</h1>
          <p className="text-muted-foreground mt-1">
            Documentação e guias para Customer Success
          </p>
        </div>

        <Link href="/playbooks/new/edit">
          <a>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Playbook
            </Button>
          </a>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Playbooks</p>
              <p className="text-2xl font-bold">{playbooks.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Visualizações</p>
              <p className="text-2xl font-bold">
                {playbooks.reduce((sum, p) => sum + p.views, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Categorias</p>
              <p className="text-2xl font-bold">7</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Autores</p>
              <p className="text-2xl font-bold">
                {new Set(playbooks.map((p) => p.author)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar playbooks por título, descrição ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="renewal">Renovação</SelectItem>
              <SelectItem value="expansion">Expansão</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
              <SelectItem value="training">Treinamento</SelectItem>
              <SelectItem value="best-practices">Melhores Práticas</SelectItem>
              <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Playbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlaybooks.map((playbook) => (
          <Card key={playbook.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{playbook.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {playbook.description}
                  </p>
                </div>
                <Badge className={getCategoryColor(playbook.category)}>
                  {getCategoryLabel(playbook.category)}
                </Badge>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {playbook.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {playbook.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(playbook.updatedAt).toLocaleDateString("pt-BR")}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {playbook.views}
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary">v{playbook.version}</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Link href={`/playbooks/${playbook.id}`}>
                  <a className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </a>
                </Link>
                <Link href={`/playbooks/${playbook.id}/edit`}>
                  <a className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </a>
                </Link>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlaybooks.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum playbook encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou criar um novo playbook
          </p>
          <Link href="/playbooks/new/edit">
            <a>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Playbook
              </Button>
            </a>
          </Link>
        </Card>
      )}
    </div>
  );
}
