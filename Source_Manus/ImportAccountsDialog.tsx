/**
 * ImportAccountsDialog Component
 * Importação em massa de accounts via arquivo Excel
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import type { Account } from "@/hooks/useAccounts";

interface ImportAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (accounts: Partial<Account>[]) => void;
}

interface ImportResult {
  success: number;
  errors: string[];
}

export default function ImportAccountsDialog({
  open,
  onOpenChange,
  onImport,
}: ImportAccountsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Partial<Account>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Download template Excel
  const downloadTemplate = () => {
    const template = [
      {
        "Nome do Account *": "Acme Corporation",
        "Indústria": "Technology",
        "Website": "https://acme.com",
        "Número de Funcionários": "150",
        "MRR (R$) *": "5000",
        "Valor do Contrato (R$)": "60000",
        "Início do Contrato": "2024-01-01",
        "Fim do Contrato": "2024-12-31",
        "Tipo de Conta": "SMB",
        "Estágio": "onboarding",
        "CSM Responsável": "John Doe",
        "Notas": "Cliente importante",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 15 }, // Indústria
      { wch: 25 }, // Website
      { wch: 20 }, // Funcionários
      { wch: 15 }, // MRR
      { wch: 20 }, // Valor Contrato
      { wch: 15 }, // Início
      { wch: 15 }, // Fim
      { wch: 15 }, // Tipo
      { wch: 15 }, // Estágio
      { wch: 20 }, // CSM
      { wch: 30 }, // Notas
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, "template_accounts.xlsx");
  };

  // Processar arquivo Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setResult(null);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Mapear dados do Excel para estrutura de Account
      const accounts: Partial<Account>[] = jsonData.map((row: any) => ({
        name: row["Nome do Account *"] || row["Nome"] || "",
        industry: row["Indústria"] || "",
        website: row["Website"] || "",
        employeeCount: row["Número de Funcionários"] ? parseInt(row["Número de Funcionários"]) : undefined,
        mrr: row["MRR (R$) *"] ? parseFloat(row["MRR (R$) *"]) : 0,
        contractValue: row["Valor do Contrato (R$)"] ? parseFloat(row["Valor do Contrato (R$)"]) : undefined,
        contractStartDate: row["Início do Contrato"] || "",
        contractEndDate: row["Fim do Contrato"] || "",
        type: (row["Tipo de Conta"] || "SMB") as any,
        stage: (row["Estágio"] || "onboarding") as any,
        csm: row["CSM Responsável"] || "",
        notes: row["Notas"] || "",
      }));

      setPreview(accounts);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setResult({
        success: 0,
        errors: ["Erro ao processar arquivo. Verifique se o formato está correto."],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Validar e importar accounts
  const handleImport = () => {
    const errors: string[] = [];
    const validAccounts: Partial<Account>[] = [];

    preview.forEach((account, index) => {
      const rowNumber = index + 2;

      // Validar campos obrigatórios
      if (!account.name || account.name.trim() === "") {
        errors.push(`Linha ${rowNumber}: Nome do Account é obrigatório`);
        return;
      }

      if (!account.mrr || account.mrr <= 0) {
        errors.push(`Linha ${rowNumber}: MRR deve ser maior que zero`);
        return;
      }

      // Validar tipos
      const validTypes = ["Enterprise", "SMB", "Strategic", "Startup"];
      if (account.type && !validTypes.includes(account.type)) {
        errors.push(`Linha ${rowNumber}: Tipo de Conta inválido (${account.type}). Use: ${validTypes.join(", ")}`);
        return;
      }

      const validStages = ["onboarding", "active", "expansion", "at-risk", "churn"];
      if (account.stage && !validStages.includes(account.stage)) {
        errors.push(`Linha ${rowNumber}: Estágio inválido (${account.stage}). Use: ${validStages.join(", ")}`);
        return;
      }

      validAccounts.push(account);
    });

    if (errors.length > 0) {
      setResult({
        success: validAccounts.length,
        errors: errors.slice(0, 10),
      });
      return;
    }

    // Importar accounts válidos
    onImport(validAccounts);
    setResult({
      success: validAccounts.length,
      errors: [],
    });

    // Limpar após 2 segundos
    setTimeout(() => {
      setFile(null);
      setPreview([]);
      setResult(null);
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Accounts via Excel</DialogTitle>
          <DialogDescription>
            Baixe o template, preencha com os dados dos accounts e faça o upload do arquivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Passo 1: Download Template */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Baixar Template</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Baixe o arquivo Excel com as colunas corretas e instruções
                </p>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Passo 2: Upload Arquivo */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Upload do Arquivo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione o arquivo Excel preenchido com os dados dos accounts
                </p>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Arquivo
                      </span>
                    </Button>
                  </label>
                  {file && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview dos Dados */}
          {preview.length > 0 && !result && (
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Preview dos Dados</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {preview.length} account(s) encontrado(s) no arquivo
                  </p>
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">MRR</th>
                          <th className="text-left p-2">Tipo</th>
                          <th className="text-left p-2">Estágio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 10).map((account, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{account.name}</td>
                            <td className="p-2">R$ {account.mrr?.toLocaleString('pt-BR')}</td>
                            <td className="p-2">{account.type}</td>
                            <td className="p-2">{account.stage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.length > 10 && (
                      <div className="p-2 text-center text-xs text-muted-foreground border-t">
                        ... e mais {preview.length - 10} account(s)
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleImport} disabled={isProcessing}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Importar {preview.length} Account(s)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setPreview([]);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultado da Importação */}
          {result && (
            <div className="space-y-3">
              {result.success > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {result.success} account(s) importado(s) com sucesso!
                  </AlertDescription>
                </Alert>
              )}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {result.errors.length} erro(s) encontrado(s):
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
