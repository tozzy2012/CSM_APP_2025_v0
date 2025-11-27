import { useState, useEffect } from "react";
import { useClientsContext, PowerMapContact, ClientContact, Client } from "@/contexts/ClientsContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  MapPin,
  Users,
  Phone,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  Minus,
  X,
  Save,
  Briefcase,
  Mail,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface EditClientDialogProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditClientDialog({ client, isOpen, onClose }: EditClientDialogProps) {
  const { updateClient } = useClientsContext();
  const { currentUser } = useAuth();

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

  // Populate form with client data when dialog opens
  useEffect(() => {
    if (client && isOpen) {
      setName(client.name || "");
      setLegalName(client.legalName || "");
      setCnpj(client.cnpj || "");
      setIndustry(client.industry || "");
      setWebsite(client.website || "");
      setAddress(client.address || {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Brasil",
      });
      setCompanySize(client.companySize || "11-50");
      setRevenue(client.revenue || "");
      setFoundedYear(client.foundedYear || new Date().getFullYear());
      setPowerMap(client.powerMap || []);
      setContacts(client.contacts || []);
      setNotes(client.notes || "");
      setTags(client.tags || []);
    }
  }, [client, isOpen]);

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

  const handleSubmit = async () => {
    if (!name || !legalName || !cnpj) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await updateClient(client.id, {
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
      });

      toast.success("Cliente atualizado com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar cliente. Tente novamente.");
      console.error("Error updating client:", error);
    }
  };

  const getInfluenceIcon = (influence: string) => {
    switch (influence) {
      case "champion": return <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />;
      case "influencer": return <TrendingUp className="h-3 w-3 text-blue-500" />;
      case "blocker": return <X className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[900px] sm:max-w-[900px] p-0 flex flex-col bg-background">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Editar Cliente
          </SheetTitle>
          <SheetDescription>
            Atualize as informações de {client.name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="company" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 border-b bg-muted/30">
              <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto gap-4">
                <TabsTrigger
                  value="company"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Empresa
                </TabsTrigger>
                <TabsTrigger
                  value="address"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Endereço
                </TabsTrigger>
                <TabsTrigger
                  value="powermap"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Mapa de Poder
                </TabsTrigger>
                <TabsTrigger
                  value="contacts"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Contatos
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              {/* Aba: Empresa */}
              <TabsContent value="company" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Fantasia <span className="text-red-500">*</span></Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Razão Social <span className="text-red-500">*</span></Label>
                    <Input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ex: Acme Corporation LTDA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ <span className="text-red-500">*</span></Label>
                    <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Setor</Label>
                    <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ex: Tecnologia" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://exemplo.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Tamanho</Label>
                    <Select value={companySize} onValueChange={setCompanySize}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 func.</SelectItem>
                        <SelectItem value="11-50">11-50 func.</SelectItem>
                        <SelectItem value="51-200">51-200 func.</SelectItem>
                        <SelectItem value="201-500">201-500 func.</SelectItem>
                        <SelectItem value="501-1000">501-1k func.</SelectItem>
                        <SelectItem value="1000+">1k+ func.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenue">Faturamento Anual</Label>
                    <Input id="revenue" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="Ex: R$ 10M" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Ano de Fundação</Label>
                    <Input id="foundedYear" type="number" value={foundedYear} onChange={(e) => setFoundedYear(parseInt(e.target.value))} placeholder="2020" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informações adicionais..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Nova tag..."
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                      className="max-w-[200px]"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive p-0.5 rounded-full hover:bg-destructive/10">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Endereço */}
              <TabsContent value="address" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} placeholder="00000-000" className="max-w-[200px]" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input id="street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Mapa de Poder */}
              <TabsContent value="powermap" className="space-y-6 mt-0">
                <div className="grid grid-cols-3 gap-6">
                  {/* Form */}
                  <div className="col-span-1 space-y-4 border-r pr-6">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Novo Stakeholder</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input value={newStakeholder.name} onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })} className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cargo</Label>
                        <Input value={newStakeholder.role} onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })} className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Influência</Label>
                        <Select value={newStakeholder.influence} onValueChange={(value: any) => setNewStakeholder({ ...newStakeholder, influence: value })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="champion">Campeão</SelectItem>
                            <SelectItem value="influencer">Influenciador</SelectItem>
                            <SelectItem value="neutral">Neutro</SelectItem>
                            <SelectItem value="blocker">Bloqueador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input value={newStakeholder.email} onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })} className="h-8" />
                      </div>
                      <Button onClick={handleAddStakeholder} size="sm" className="w-full mt-2">Adicionar</Button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="col-span-2 space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Stakeholders ({powerMap.length})</h4>
                    {powerMap.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum stakeholder</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {powerMap.map((stakeholder) => (
                          <div key={stakeholder.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getInfluenceIcon(stakeholder.influence)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{stakeholder.name}</p>
                                <p className="text-xs text-muted-foreground">{stakeholder.role}</p>
                                {stakeholder.email && <p className="text-xs text-muted-foreground mt-0.5">{stakeholder.email}</p>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveStakeholder(stakeholder.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Contatos */}
              <TabsContent value="contacts" className="space-y-6 mt-0">
                <div className="grid grid-cols-3 gap-6">
                  {/* Form */}
                  <div className="col-span-1 space-y-4 border-r pr-6">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Novo Contato</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <Select value={newContact.type} onValueChange={(value: any) => setNewContact({ ...newContact, type: value })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor</Label>
                        <Input value={newContact.value} onChange={(e) => setNewContact({ ...newContact, value: e.target.value })} className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input value={newContact.label} onChange={(e) => setNewContact({ ...newContact, label: e.target.value })} className="h-8" placeholder="Ex: Comercial" />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input type="checkbox" checked={newContact.isPrimary} onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })} id="isPrimary" className="rounded border-gray-300" />
                        <Label htmlFor="isPrimary" className="text-xs cursor-pointer">Principal</Label>
                      </div>
                      <Button onClick={handleAddContact} size="sm" className="w-full mt-2">Adicionar</Button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="col-span-2 space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Contatos ({contacts.length})</h4>
                    {contacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum contato</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize">{contact.type}</Badge>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{contact.value}</p>
                                  {contact.isPrimary && <Badge variant="default" className="text-[10px] h-4 px-1">Principal</Badge>}
                                </div>
                                {contact.label && <p className="text-xs text-muted-foreground">{contact.label}</p>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveContact(contact.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
