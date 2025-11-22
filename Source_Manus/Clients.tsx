import { useState } from "react";
import { useClientsContext } from "@/contexts/ClientsContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  Globe,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import AddClientDialog from "@/components/AddClientDialog";
import ImportClientsDialog from "@/components/ImportClientsDialog";
import { Upload } from "lucide-react";

export default function Clients() {
  const { clients, deleteClient, addClient } = useClientsContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<any>(null);

  // Filtrar clientes
  const filteredClients = clients.filter((client) => {
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.legalName.toLowerCase().includes(search) ||
      client.cnpj.includes(search) ||
      client.industry.toLowerCase().includes(search)
    );
  });

  const getCompanySizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      "1-10": "1-10 funcionários",
      "11-50": "11-50 funcionários",
      "51-200": "51-200 funcionários",
      "201-500": "201-500 funcionários",
      "501-1000": "501-1000 funcionários",
      "1000+": "1000+ funcionários",
    };
    return labels[size] || size;
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gerencie seu portfólio de clientes e empresas
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Importar Clientes
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CNPJ, razão social ou setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Clientes */}
        {filteredClients.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Tente ajustar sua busca"
                : "Comece cadastrando seu primeiro cliente"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link href={`/clients/${client.id}`}>
                        <a className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {client.name}
                        </a>
                      </Link>
                      {client.industry && (
                        <Badge variant="outline" className="text-xs">
                          {client.industry}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Razão Social */}
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-600 text-xs">Razão Social</p>
                          <p className="text-gray-900 font-medium">{client.legalName}</p>
                        </div>
                      </div>

                      {/* CNPJ */}
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-600 text-xs">CNPJ</p>
                          <p className="text-gray-900 font-medium">{client.cnpj}</p>
                        </div>
                      </div>

                      {/* Localização */}
                      {client.address.city && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-gray-600 text-xs">Localização</p>
                            <p className="text-gray-900 font-medium">
                              {client.address.city}, {client.address.state}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tamanho */}
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-600 text-xs">Tamanho</p>
                          <p className="text-gray-900 font-medium">
                            {getCompanySizeLabel(client.companySize)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contatos Principais */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </a>
                      )}
                      {client.powerMap.length > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Users className="h-3.5 w-3.5" />
                          {client.powerMap.length} stakeholder
                          {client.powerMap.length > 1 ? "s" : ""}
                        </div>
                      )}
                      {client.contacts.length > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5" />
                          {client.contacts.length} contato
                          {client.contacts.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingClient(client)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Dialog */}
      {isAddDialogOpen && (
        <AddClientDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
        />
      )}

      {/* Import Clients Dialog */}
      <ImportClientsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={(importedClients) => {
          importedClients.forEach((client) => {
            addClient(client as any);
          });
          toast.success(`${importedClients.length} cliente(s) importado(s) com sucesso!`);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o cliente <strong>{deletingClient?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingClient(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteClient(deletingClient.id);
                toast.success('Cliente excluído com sucesso');
                setDeletingClient(null);
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
