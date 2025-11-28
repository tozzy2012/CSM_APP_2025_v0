import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportClientsDialogProps {
  children?: React.ReactNode;
  onImported?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ImportClientsDialog({
  children,
  onImported,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: ImportClientsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/v1/clients/import/template");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_clientes.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Erro ao baixar template");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/v1/clients/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro na importação");
      }

      const data = await response.json();
      setResult(data);

      if (data.success > 0) {
        toast.success(`${data.success} clientes importados com sucesso!`);
        if (onImported) onImported();
      } else {
        toast.warning("Nenhum cliente foi importado.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResult(null);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Importe múltiplos clientes de uma vez usando um arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="grid gap-6 py-4">
            {/* Step 1: Download Template */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">1. Baixe o modelo</Label>
              <p className="text-sm text-muted-foreground">
                Use nosso template CSV para garantir que seus dados estejam no formato correto.
              </p>
              <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Baixar Template CSV
              </Button>
            </div>

            <div className="border-t my-2" />

            {/* Step 2: Upload File */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">2. Faça upload do arquivo preenchido</Label>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-xs text-green-800 font-medium">Importados</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center">
                <div className="text-2xl font-bold text-yellow-600">{result.duplicates}</div>
                <div className="text-xs text-yellow-800 font-medium">Duplicados</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                <div className="text-xs text-red-800 font-medium">Erros</div>
              </div>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="mt-4">
                <Label>Detalhes:</Label>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4 mt-2 bg-muted/50">
                  <ul className="space-y-2 text-sm">
                    {result.details.map((detail: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Clientes
                </>
              )}
            </Button>
          ) : (
            <Button onClick={resetDialog}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
