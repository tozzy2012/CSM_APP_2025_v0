import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePlaybooksContext } from "@/contexts/PlaybooksContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Calendar, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import RichTextEditor from "@/components/RichTextEditor";

interface PlaybookViewProps {
  id: string;
}

export default function PlaybookView({ id }: PlaybookViewProps) {
  const [location, setLocation] = useLocation();
  const { getPlaybook, incrementViews } = usePlaybooksContext();
  const [playbook, setPlaybook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaybook();
    incrementViews(id);
  }, [id]);

  const loadPlaybook = async () => {
    setLoading(true);
    try {
      const data = await getPlaybook(id);
      if (data) {
        setPlaybook(data);
      } else {
        setLocation("/playbooks");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Carregando...</div>;
  }

  if (!playbook) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/playbooks")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Biblioteca
        </Button>
        <Button onClick={() => setLocation(`/playbooks/${id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar Playbook
        </Button>
      </div>

      {/* Title & Meta */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary">{playbook.category}</Badge>
            <Badge variant="outline">v{playbook.version}</Badge>
            {playbook.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {playbook.name}
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            {playbook.description}
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground border-y py-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{playbook.author || "Sistema"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {playbook.updatedAt
                ? format(new Date(playbook.updatedAt), "dd 'de' MMMM, yyyy", { locale: ptBR })
                : "Data desconhecida"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{playbook.views} visualizações</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="min-h-[500px]">
        <CardContent className="p-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* We use RichTextEditor in read-only mode to render content safely and consistently */}
            <RichTextEditor content={playbook.content} editable={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
