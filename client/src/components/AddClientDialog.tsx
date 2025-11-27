import { useState, useEffect } from "react";
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
  Users,
  Phone,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  Minus,
  X,
  DollarSign,
  UserCheck,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Pre-populated suggested tags
const SUGGESTED_TAGS = [
  "SaaS",
  "B2B",
  "B2C",
  "Enterprise",
  "Mid-Market",
  "SMB",
  "Startup",
  "Scale-up",
  "Tech",
  "Fintech",
  "Healthtech",
  "Edtech",
];

export default function AddClientDialog({ isOpen, onClose }: AddClientDialogProps) {
  const { addClient } = useClientsContext();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Company Data
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [companySize, setCompanySize] = useState<string>("11-50");

  // Power Map (Winning by Design)
  const [powerMap, setPowerMap] = useState<PowerMapContact[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    role: "",
    department: "",
    influence: "champion" as const,
    email: "",
    phone: "",
    notes: "",
  });

  // Contacts
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [newContact, setNewContact] = useState({
    type: "phone" as const,
    value: "",
    label: "",
    isPrimary: false,
  });

  // Notes and Tags
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
      influence: "champion",
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

  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || newTag;
    if (tagToAdd && !tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!name || !legalName || !cnpj) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setIsSubmitting(true);
      const newClient = await addClient({
        name,
        legalName,
        cnpj,
        industry,
        website,
        companySize: companySize as any,
        powerMap,
        contacts,
        notes,
        tags,
        createdBy: currentUser?.name || "Unknown",
      });

      toast.success("Cliente cadastrado com sucesso!");
      onClose();
      setLocation(`/clients/${newClient.id}`);
    } catch (error) {
      toast.error("Erro ao cadastrar cliente. Tente novamente.");
      console.error("Error creating client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInfluenceIcon = (influence: string) => {
    switch (influence) {
      case "economic_buyer":
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case "champion":
        return <Star className="h-4 w-4 text-green-600" />;
      case "influencer":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "technical_buyer":
        return <Shield className="h-4 w-4 text-indigo-600" />;
      case "blocker":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInfluenceLabel = (influence: string) => {
    const labels: Record<string, string> = {
      economic_buyer: "Economic Buyer",
      champion: "Champion",
      influencer: "Influencer",
      technical_buyer: "Technical Buyer",
      blocker: "Blocker",
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
      <DialogContent className="w-[90vw] max-w-[1800px] max-h-[95vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Cliente</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="company" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Empresa
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

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6 mt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome Fantasia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Acme Corp"
                  className="h-11"
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
                  className="h-11"
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
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Setor</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ex: Tecnologia"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Tamanho da Empresa</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger className="h-11">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre o cliente..."
                rows={6}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Digite ou selecione uma tag..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    className="h-12 text-base"
                  />
                  <Button type="button" onClick={() => handleAddTag()} variant="outline" className="h-12 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {/* Suggested Tags Below Input */}
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Sugestões (clique para preencher):</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5"
                        onClick={() => setNewTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tags selecionadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="default" className="px-3 py-1.5">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-red-200 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Power Map Tab - Winning by Design */}
          <TabsContent value="powermap" className="space-y-6 mt-6">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Mapa de Poder (Winning by Design):</strong> Identifique os stakeholders-chave usando a metodologia Winning by Design. Mapeie quem toma decisões econômicas, quem defende sua solução, quem influencia e quem pode bloquear.
              </p>
            </Card>

            {/* Add Stakeholder Form */}
            <Card className="p-6 space-y-4 bg-gray-50">
              <h3 className="font-semibold text-lg">Adicionar Stakeholder</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={newStakeholder.name}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                    placeholder="Nome completo"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Input
                    value={newStakeholder.role}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                    placeholder="CEO, CTO, CFO, etc."
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input
                    value={newStakeholder.department}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, department: e.target.value })}
                    placeholder="TI, Financeiro, Comercial, etc."
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Papel no Deal (Winning by Design)</Label>
                  <Select
                    value={newStakeholder.influence}
                    onValueChange={(value: any) => setNewStakeholder({ ...newStakeholder, influence: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economic_buyer">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                          Economic Buyer
                        </div>
                      </SelectItem>
                      <SelectItem value="champion">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-green-600" />
                          Champion
                        </div>
                      </SelectItem>
                      <SelectItem value="influencer">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          Influencer
                        </div>
                      </SelectItem>
                      <SelectItem value="technical_buyer">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-indigo-600" />
                          Technical Buyer
                        </div>
                      </SelectItem>
                      <SelectItem value="blocker">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4 text-red-600" />
                          Blocker
                        </div>
                      </SelectItem>
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={newStakeholder.phone}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="h-11"
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

              <Button type="button" onClick={handleAddStakeholder} className="w-full h-11">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Stakeholder
              </Button>
            </Card>

            {/* Stakeholders List */}
            {powerMap.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Stakeholders Cadastrados ({powerMap.length})</h3>
                <div className="grid grid-cols-1 gap-3">
                  {powerMap.map((stakeholder) => (
                    <Card key={stakeholder.id} className="p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg">{stakeholder.name}</h4>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getInfluenceIcon(stakeholder.influence)}
                              <span>{getInfluenceLabel(stakeholder.influence)}</span>
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6 mt-6">
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-900">
                <strong>Contatos:</strong> Cadastre telefones, WhatsApp, e-mails e outros meios de contato da empresa.
              </p>
            </Card>

            {/* Add Contact Form */}
            <Card className="p-6 space-y-4 bg-gray-50">
              <h3 className="font-semibold text-lg">Adicionar Contato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newContact.type}
                    onValueChange={(value: any) => setNewContact({ ...newContact, type: value })}
                  >
                    <SelectTrigger className="h-11">
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={newContact.label}
                    onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                    placeholder="Ex: Telefone Comercial, WhatsApp CEO"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer h-11">
                    <input
                      type="checkbox"
                      checked={newContact.isPrimary}
                      onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Contato Principal</span>
                  </label>
                </div>
              </div>

              <Button type="button" onClick={handleAddContact} className="w-full h-11">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </Card>

            {/* Contacts List */}
            {contacts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Contatos Cadastrados ({contacts.length})</h3>
                <div className="grid grid-cols-1 gap-2">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="p-4">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="h-11 px-6">
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="h-11 px-6">
            {isSubmitting ? "Cadastrando..." : "Cadastrar Cliente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
