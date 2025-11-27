/**
 * Clients Page
 * Premium SaaS Design
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Building2,
  Globe,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  DollarSign,
  Tag
} from "lucide-react";
import { toast } from "sonner";

import { useClientsContext, Client } from "@/contexts/ClientsContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import AddClientDialog from "@/components/AddClientDialog";
import EditClientDialog from "@/components/EditClientDialog";
import ImportClientsDialog from "@/components/ImportClientsDialog";

export default function Clients() {
  const { clients, deleteClient, addClient, error, loading } = useClientsContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Filter Logic
  const filteredClients = clients.filter((client) => {
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.legalName?.toLowerCase().includes(search) ||
      client.cnpj?.includes(search) ||
      client.industry?.toLowerCase().includes(search)
    );
  });

  // Helpers
  const getCompanySizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      "1-10": "1-10 func.",
      "11-50": "11-50 func.",
      "51-200": "51-200 func.",
      "201-500": "201-500 func.",
      "501-1000": "501-1k func.",
      "1000+": "1k+ func.",
    };
    return labels[size] || size;
  };

  const handleCardClick = (clientId: string, e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    setLocation(`/clients/${clientId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seu portfólio de empresas e stakeholders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content */}
      <div className="px-8 py-8">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                <h3 className="text-2xl font-bold">{clients.length}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 flex items-center justify-between">
            <p>Erro ao carregar clientes: {error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Clients Grid */}
        {!error && filteredClients.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed">
            <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchTerm
                ? `Não encontramos resultados para "${searchTerm}"`
                : "Comece adicionando seu primeiro cliente para gerenciar seu portfólio."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="group hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer hover:border-primary/50"
                onClick={(e) => handleCardClick(client.id, e)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">

                    {/* Logo Icon (Replaced Avatar) */}
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-xl bg-primary/5 border flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary/70" />
                      </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {client.name}
                            </h3>
                            {client.industry && (
                              <Badge variant="secondary" className="font-normal">
                                {client.industry}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {client.legalName} • {client.cnpj}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClient(client);
                            }}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingClient(client);
                            }}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Details Grid - Expanded with more info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6 mt-6 text-sm">
                        {/* Location */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {client.address?.city ? `${client.address.city}, ${client.address.state}` : "Localização não informada"}
                          </span>
                        </div>

                        {/* Size */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>{getCompanySizeLabel(client.companySize)}</span>
                        </div>

                        {/* Revenue (New) */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4 flex-shrink-0" />
                          <span>{client.revenue || "Faturamento N/A"}</span>
                        </div>

                        {/* Stakeholders Count (New) */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {client.powerMap?.length || 0} Stakeholders
                          </span>
                        </div>

                        {/* Website */}
                        {client.website && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            <a
                              href={client.website}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-primary hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {client.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}

                        {/* Contacts Count */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {client.contacts?.length || 0} contatos
                          </span>
                        </div>
                      </div>

                      {/* Tags (New) */}
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-2">
                            {client.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs py-0 h-5 bg-muted/30">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddClientDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      <ImportClientsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={(importedClients) => {
          importedClients.forEach((client) => addClient(client as any));
          toast.success(`${importedClients.length} clientes importados!`);
        }}
      />

      {
        editingClient && (
          <EditClientDialog
            client={editingClient}
            isOpen={!!editingClient}
            onClose={() => setEditingClient(null)}
          />
        )
      }

      <Dialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deletingClient?.name}</strong>?
              Esta ação não pode ser desfeita e removerá todos os dados associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingClient(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingClient) {
                  deleteClient(deletingClient.id);
                  toast.success("Cliente excluído com sucesso");
                  setDeletingClient(null);
                }
              }}
            >
              Excluir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
