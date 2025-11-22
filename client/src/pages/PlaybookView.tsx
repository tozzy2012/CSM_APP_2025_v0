/**
 * Playbook View Page
 * Visualização de playbook com formatação completa
 */
import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/RichTextEditor";
import {
  ArrowLeft,
  Edit,
  Download,
  Share2,
  Calendar,
  User,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { usePlaybooksContext } from "@/contexts/PlaybooksContext";

// Declare global html2pdf to avoid TS errors
declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function PlaybookView() {
  const [, params] = useRoute("/playbooks/:id");
  const { getPlaybook, incrementViews } = usePlaybooksContext();

  const playbook = getPlaybook(params?.id || "");

  // Incrementar views ao carregar
  useEffect(() => {
    if (playbook) {
      incrementViews(playbook.id);
    }
  }, [playbook?.id]);

  if (!playbook) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Playbook não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O playbook que você está procurando não existe ou foi removido.
          </p>
          <Link href="/playbooks">
            <a>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Biblioteca
              </Button>
            </a>
          </Link>
        </Card>
      </div>
    );
  }

  const handleDownloadHTML = () => {
    const blob = new Blob([playbook.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${playbook.title.replace(/\s+/g, "_")}.html`;
    a.click();
    toast.success("HTML baixado!");
  };

  const handleDownloadPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif;">
        <h1 style="font-size: 32px; margin-bottom: 10px;">${playbook.title}</h1>
        <p style="color: #666; margin-bottom: 20px;">${playbook.description}</p>
        <p style="font-size: 12px; color: #999; margin-bottom: 30px;">
          Autor: ${playbook.author} | Versão: ${playbook.version} | 
          Atualizado: ${new Date(playbook.updatedAt).toLocaleDateString("pt-BR")}
        </p>
        <hr style="margin-bottom: 30px;" />
        ${playbook.content}
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `${playbook.title.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
    };

    // Use window.html2pdf
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
      toast.success("PDF sendo gerado...");
    } else {
      toast.error("Erro ao carregar biblioteca de PDF");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/playbooks">
            <a>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
            <Download className="w-4 h-4 mr-2" />
            Download HTML
          </Button>
          <Link href={`/playbooks/${playbook.id}/edit`}>
            <a>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </a>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-8">
            {/* Title and Meta */}
            <div className="mb-8 pb-6 border-b border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{playbook.title}</h1>
                  <p className="text-lg text-muted-foreground">
                    {playbook.description}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4">
                  v{playbook.version}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {playbook.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{playbook.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Atualizado em{" "}
                    {new Date(playbook.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{playbook.views} visualizações</span>
                </div>
              </div>
            </div>

            {/* Rich Content */}
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
              <RichTextEditor content={playbook.content} editable={false} />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Informações</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Categoria</p>
                <p className="font-medium capitalize">{playbook.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Versão</p>
                <p className="font-medium">{playbook.version}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {new Date(playbook.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última atualização</p>
                <p className="font-medium">
                  {new Date(playbook.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Ações</h3>
            <div className="space-y-2">
              <Link href={`/playbooks/${playbook.id}/edit`}>
                <a className="block">
                  <Button variant="outline" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Playbook
                  </Button>
                </a>
              </Link>
              <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={handleDownloadHTML}>
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
