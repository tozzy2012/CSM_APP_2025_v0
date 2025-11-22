import { useState } from "react";
import { useClientsContext, PowerMapContact, ClientContact } from "@/contexts/ClientsContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  Minus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddClientDialog({ isOpen, onClose }: AddClientDialogProps) {
  const { addClient } = useClientsContext();
  const [, setLocation] = useLocation();

  // Dados da Empresa
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  // Endereço
  const [address, setAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
  });

  // Informações Comerciais
  const [companySize, setCompanySize] = useState<string>("11-50");
  const [revenue, setRevenue] = useState("");
  const [foundedYear, setFoundedYear] = useState<number>(new Date().getFullYear());

  // Mapa de Poder
  const [powerMap, setPowerMap] = useState<PowerMapContact[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    role: "",
    department: "",
    influence: "neutral" as const,
    email: "",
    phone: "",
    notes: "",
  });

  // Contatos
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [newContact, setNewContact] = useState({
    type: "phone" as const,
    value: "",
    label: "",
    isPrimary: false,
  });

  // Notas e Tags
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleAddStakeholder = () => {
    if (!newStakeholder.name || !newStakeholder.role) {
      toast.error("Nome e cargo são obrigatórios");
      return;
    }

    const stakeholder: PowerMapContact = {
      id: Date.now().toString(),
      ...newStakeholder,
    };

    setPowerMap([...powerMap, stakeholder]);
    setNewStakeholder({
      name: "",
      role: "",
      department: "",
      influence: "neutral",
      email: "",
      phone: "",
      notes: "",
    });
    toast.success("Stakeholder adicionado");
  };

  const handleRemoveStakeholder = (id: string) => {
    setPowerMap(powerMap.filter((s) => s.id !== id));
  };

  const handleAddContact = () => {
    if (!newContact.value) {
      toast.error("Valor do contato é obrigatório");
      return;
    }

    const contact: ClientContact = {
      id: Date.now().toString(),
      ...newContact,
    };

    setContacts([...contacts, contact]);
    setNewContact({
      type: "phone",
      value: "",
      label: "",
      isPrimary: false,
    });
    toast.success("Contato adicionado");
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const { currentUser } = useAuth();

  const handleSubmit = () => {
    if (!name || !legalName || !cnpj) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const newClient = addClient({
      organizationId: currentUser?.organizationId || "",
      name,
      legalName,
      cnpj,
      industry,
      website,
      address,
      companySize: companySize as any,
      revenue,
      foundedYear,
      powerMap,
      contacts,
      notes,
      tags,
      createdBy: "John Doe", // TODO: Pegar do contexto de autenticação
    });

    toast.success("Cliente cadastrado com sucesso!");
    onClose();
    setLocation(`/clients/${newClient.id}`);
  };

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

  const getContactTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone: "Telefone",
      whatsapp: "WhatsApp",
      email: "E-mail",
      other: "Outro",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Cliente</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="company" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="address">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="powermap">
              <Users className="h-4 w-4 mr-2" />
              Mapa de Poder
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Phone className="h-4 w-4 mr-2" />
              Contatos
            </TabsTrigger>
          </TabsList>

          {/* Aba: Empresa */}
          <TabsContent value="company" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome Fantasia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ex: Acme Corporation LTDA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Setor</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ex: Tecnologia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Tamanho da Empresa</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 funcionários</SelectItem>
                    <SelectItem value="11-50">11-50 funcionários</SelectItem>
                    <SelectItem value="51-200">51-200 funcionários</SelectItem>
                    <SelectItem value="201-500">201-500 funcionários</SelectItem>
                    <SelectItem value="501-1000">501-1000 funcionários</SelectItem>
                    <SelectItem value="1000+">1000+ funcionários</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue">Faturamento Anual</Label>
                <Input
                  id="revenue"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="Ex: R$ 10M"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foundedYear">Ano de Fundação</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(parseInt(e.target.value))}
                  placeholder="2020"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Adicionar tag..."
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba: Endereço */}
          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Nome da rua"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  placeholder="Sala, andar, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="SP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  placeholder="Brasil"
                />
              </div>
            </div>
          </TabsContent>

          {/* Aba: Mapa de Poder */}
          <TabsContent value="powermap" className="space-y-4 mt-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Mapa de Poder:</strong> Cadastre os principais stakeholders e tomadores de decisão da empresa.
              </p>
            </Card>

            {/* Formulário de Novo Stakeholder */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Adicionar Stakeholder</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={newStakeholder.name}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Input
                    value={newStakeholder.role}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                    placeholder="CEO, CTO, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input
                    value={newStakeholder.department}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, department: e.target.value })}
                    placeholder="TI, Comercial, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nível de Influência</Label>
                  <Select
                    value={newStakeholder.influence}
                    onValueChange={(value: any) => setNewStakeholder({ ...newStakeholder, influence: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="champion">Campeão</SelectItem>
                      <SelectItem value="influencer">Influenciador</SelectItem>
                      <SelectItem value="neutral">Neutro</SelectItem>
                      <SelectItem value="blocker">Bloqueador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={newStakeholder.email}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={newStakeholder.phone}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={newStakeholder.notes}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, notes: e.target.value })}
                    placeholder="Notas sobre este stakeholder..."
                    rows={2}
                  />
                </div>
              </div>

              <Button type="button" onClick={handleAddStakeholder} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Stakeholder
              </Button>
            </Card>

            {/* Lista de Stakeholders */}
            {powerMap.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Stakeholders Cadastrados ({powerMap.length})</h3>
                {powerMap.map((stakeholder) => (
                  <Card key={stakeholder.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{stakeholder.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getInfluenceIcon(stakeholder.influence)}
                            <span className="ml-1">{getInfluenceLabel(stakeholder.influence)}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Cargo:</strong> {stakeholder.role}</p>
                          {stakeholder.department && <p><strong>Departamento:</strong> {stakeholder.department}</p>}
                          {stakeholder.email && <p><strong>E-mail:</strong> {stakeholder.email}</p>}
                          {stakeholder.phone && <p><strong>Telefone:</strong> {stakeholder.phone}</p>}
                          {stakeholder.notes && <p><strong>Observações:</strong> {stakeholder.notes}</p>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStakeholder(stakeholder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba: Contatos */}
          <TabsContent value="contacts" className="space-y-4 mt-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-900">
                <strong>Contatos:</strong> Cadastre telefones, WhatsApp, e-mails e outros meios de contato.
              </p>
            </Card>

            {/* Formulário de Novo Contato */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Adicionar Contato</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newContact.type}
                    onValueChange={(value: any) => setNewContact({ ...newContact, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    value={newContact.value}
                    onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
                    placeholder="(11) 99999-9999 ou email@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={newContact.label}
                    onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                    placeholder="Ex: Telefone Comercial, WhatsApp CEO"
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newContact.isPrimary}
                      onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Contato Principal</span>
                  </label>
                </div>
              </div>

              <Button type="button" onClick={handleAddContact} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </Card>

            {/* Lista de Contatos */}
            {contacts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Contatos Cadastrados ({contacts.length})</h3>
                <div className="grid grid-cols-1 gap-2">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{getContactTypeLabel(contact.type)}</Badge>
                          <div>
                            <p className="font-medium">{contact.value}</p>
                            {contact.label && <p className="text-sm text-gray-600">{contact.label}</p>}
                          </div>
                          {contact.isPrimary && (
                            <Badge variant="default" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Cadastrar Cliente</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
