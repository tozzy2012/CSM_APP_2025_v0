/**
 * ImportClientsDialog Component
 * Importação em massa de clientes via arquivo Excel
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import type { Client } from "@/hooks/useClients";

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (clients: Partial<Client>[]) => void;
}

interface ImportResult {
  success: number;
  errors: string[];
}

export default function ImportClientsDialog({
  open,
  onOpenChange,
  onImport,
}: ImportClientsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Partial<Client>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Download template Excel
  const downloadTemplate = () => {
    const template = [
      {
        "Nome/Razão Social *": "Exemplo Empresa Ltda",
        "Nome Fantasia": "Exemplo",
        "CNPJ *": "12.345.678/0001-90",
        "Endereço": "Rua Exemplo, 123",
        "Cidade": "São Paulo",
        "Estado": "SP",
        "CEP": "01234-567",
        "Telefone Principal": "(11) 1234-5678",
        "WhatsApp": "(11) 98765-4321",
        "Email Principal *": "contato@exemplo.com",
        "Website": "https://exemplo.com",
        "Indústria": "Technology",
        "Número de Funcionários": "50",
        "Faturamento Anual (R$)": "1000000",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Nome/Razão Social
      { wch: 20 }, // Nome Fantasia
      { wch: 20 }, // CNPJ
      { wch: 30 }, // Endereço
      { wch: 15 }, // Cidade
      { wch: 5 },  // Estado
      { wch: 12 }, // CEP
      { wch: 18 }, // Telefone
      { wch: 18 }, // WhatsApp
      { wch: 25 }, // Email
      { wch: 25 }, // Website
      { wch: 15 }, // Indústria
      { wch: 20 }, // Funcionários
      { wch: 20 }, // Faturamento
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, "template_clientes.xlsx");
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

      // Mapear dados do Excel para estrutura de Client
      const clients: Partial<Client>[] = jsonData.map((row: any) => {
        const email = row["Email Principal *"] || row["Email"] || "";
        const phone = row["Telefone Principal"] || row["Telefone"] || "";
        const whatsapp = row["WhatsApp"] || "";
        
        return {
          name: row["Nome Fantasia"] || row["Nome"] || "",
          legalName: row["Nome/Razão Social *"] || row["Razão Social"] || "",
          cnpj: row["CNPJ *"] || row["CNPJ"] || "",
          industry: row["Indústria"] || "",
          website: row["Website"] || "",
          address: {
            street: row["Endereço"] || "",
            number: "",
            complement: "",
            neighborhood: "",
            city: row["Cidade"] || "",
            state: row["Estado"] || "",
            zipCode: row["CEP"] || "",
            country: "Brasil",
          },
          companySize: "11-50" as const,
          revenue: row["Faturamento Anual (R$)"] || "",
          foundedYear: new Date().getFullYear(),
          powerMap: [],
          contacts: [
            ...(email ? [{
              id: Date.now().toString(),
              type: "email" as const,
              value: email,
              label: "Email Principal",
              isPrimary: true,
            }] : []),
            ...(phone ? [{
              id: (Date.now() + 1).toString(),
              type: "phone" as const,
              value: phone,
              label: "Telefone Principal",
              isPrimary: true,
            }] : []),
            ...(whatsapp ? [{
              id: (Date.now() + 2).toString(),
              type: "whatsapp" as const,
              value: whatsapp,
              label: "WhatsApp",
              isPrimary: false,
            }] : []),
          ],
          notes: "",
          tags: [],
        };
      });

      setPreview(clients);
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

  // Validar e importar clientes
  const handleImport = () => {
    const errors: string[] = [];
    const validClients: Partial<Client>[] = [];

    preview.forEach((client, index) => {
      const rowNumber = index + 2; // +2 porque linha 1 é header e Excel começa em 1

      // Validar campos obrigatórios
      if (!client.legalName || client.legalName.trim() === "") {
        errors.push(`Linha ${rowNumber}: Razão Social é obrigatória`);
        return;
      }

      if (!client.cnpj || client.cnpj.trim() === "") {
        errors.push(`Linha ${rowNumber}: CNPJ é obrigatório`);
        return;
      }

      // Validar se tem pelo menos um contato de email
      const hasEmail = client.contacts && client.contacts.some(c => c.type === "email" && c.value.trim() !== "");
      if (!hasEmail) {
        errors.push(`Linha ${rowNumber}: Email é obrigatório`);
        return;
      }

      // Validar formato de email
      const emailContact = client.contacts?.find(c => c.type === "email");
      if (emailContact) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailContact.value)) {
          errors.push(`Linha ${rowNumber}: Email inválido (${emailContact.value})`);
          return;
        }
      }

      validClients.push(client);
    });

    if (errors.length > 0) {
      setResult({
        success: validClients.length,
        errors: errors.slice(0, 10), // Mostrar apenas primeiros 10 erros
      });
      return;
    }

    // Importar clientes válidos
    onImport(validClients);
    setResult({
      success: validClients.length,
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
          <DialogTitle>Importar Clientes via Excel</DialogTitle>
          <DialogDescription>
            Baixe o template, preencha com os dados dos clientes e faça o upload do arquivo
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
                  Selecione o arquivo Excel preenchido com os dados dos clientes
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
                    {preview.length} cliente(s) encontrado(s) no arquivo
                  </p>
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">CNPJ</th>
                          <th className="text-left p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 10).map((client, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{client.name || client.legalName}</td>
                            <td className="p-2">{client.cnpj}</td>
                            <td className="p-2">{client.contacts?.find(c => c.type === "email")?.value || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.length > 10 && (
                      <div className="p-2 text-center text-xs text-muted-foreground border-t">
                        ... e mais {preview.length - 10} cliente(s)
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleImport} disabled={isProcessing}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Importar {preview.length} Cliente(s)
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
                    {result.success} cliente(s) importado(s) com sucesso!
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
