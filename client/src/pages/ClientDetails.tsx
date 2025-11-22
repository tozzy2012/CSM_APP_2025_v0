import { useState } from "react";
import EditClientDialog from "@/components/EditClientDialog";
import { useParams, useLocation } from "wouter";
import { useClientsContext } from "@/contexts/ClientsContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowLeft,
  Pencil,
  Star,
  TrendingUp,
  Minus,
  X,
  ExternalLink,
} from "lucide-react";

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { clients } = useClientsContext();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Cliente não encontrado</h1>
          <Button onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Clientes
          </Button>
        </div>
      </div>
    );
  }

  const getInfluenceIcon = (influence: string) => {
    switch (influence) {
      case "champion":
        return <Star className="h-4 w-4 text-green-600" />;
      case "influencer":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-600" />;
      case "blocker":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getInfluenceLabel = (influence: string) => {
    const labels: Record<string, string> = {
      champion: "Campeão",
      influencer: "Influenciador",
      neutral: "Neutro",
      blocker: "Bloqueador",
    };
    return labels[influence] || influence;
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "whatsapp":
        return <Phone className="h-4 w-4 text-green-600" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getContactTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone: "Telefone",
      whatsapp: "WhatsApp",
      email: "E-mail",
      other: "Outro",
    };
    return labels[type] || type;
  };

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
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/clients")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground">{client.legalName}</p>
            </div>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Cliente
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setor</p>
                <p className="font-semibold">{client.industry || "Não informado"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamanho</p>
                <p className="font-semibold">{getCompanySizeLabel(client.companySize)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fundação</p>
                <p className="font-semibold">{client.foundedYear}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="powermap">Mapa de Poder</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Informações Básicas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{client.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{client.legalName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <p className="font-medium">{client.industry || "Não informado"}</p>
                </div>
                {client.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {client.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {client.revenue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento Anual</p>
                    <p className="font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {client.revenue}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Endereço */}
            {client.address && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">
                    {client.address.street}, {client.address.number}
                    {client.address.complement && ` - ${client.address.complement}`}
                  </p>
                  <p className="text-muted-foreground">
                    {client.address.neighborhood} - {client.address.city}/{client.address.state}
                  </p>
                  <p className="text-muted-foreground">
                    CEP: {client.address.zipCode} - {client.address.country}
                  </p>
                </div>
              </Card>
            )}

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Observações */}
            {client.notes && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Observações</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </Card>
            )}
          </TabsContent>

          {/* Power Map Tab */}
          <TabsContent value="powermap" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mapa de Poder ({client.powerMap.length} stakeholders)
              </h3>

              {client.powerMap.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum stakeholder cadastrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.powerMap.map((stakeholder) => (
                    <Card key={stakeholder.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{stakeholder.name}</h4>
                          <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                          {stakeholder.department && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {stakeholder.department}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getInfluenceIcon(stakeholder.influence)}
                          {getInfluenceLabel(stakeholder.influence)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        {stakeholder.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${stakeholder.email}`} className="hover:underline">
                              {stakeholder.email}
                            </a>
                          </div>
                        )}
                        {stakeholder.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${stakeholder.phone}`} className="hover:underline">
                              {stakeholder.phone}
                            </a>
                          </div>
                        )}
                        {stakeholder.notes && (
                          <p className="text-muted-foreground mt-2 pt-2 border-t">
                            {stakeholder.notes}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contatos ({client.contacts.length})
              </h3>

              {client.contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum contato cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.contacts.map((contact) => (
                    <Card key={contact.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getContactTypeIcon(contact.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{contact.value}</p>
                              {contact.isPrimary && (
                                <Badge variant="default" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{getContactTypeLabel(contact.type)}</span>
                              {contact.label && (
                                <>
                                  <span>•</span>
                                  <span>{contact.label}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <EditClientDialog
          client={client}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      </div>
    </div>
  );
}
