/**
 * Playbooks Page - Knowledge Base & Documentation
 */
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, Edit, Trash2, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { usePlaybooks, PlaybookDoc } from "@/hooks/usePlaybooks";

const CATEGORIES = [
    { value: "all", label: "Todas Categorias" },
    { value: "onboarding", label: "Onboarding" },
    { value: "renewal", label: "Renovação" },
    { value: "expansion", label: "Expansão" },
    { value: "support", label: "Suporte" },
    { value: "training", label: "Treinamento" },
    { value: "best-practices", label: "Melhores Práticas" },
];

export default function Playbooks() {
    const {
        playbooks,
        loading,
        error,
        createPlaybook,
        updatePlaybook,
        deletePlaybook,
        incrementViews,
    } = usePlaybooks();

    console.log("📊 Playbooks.tsx - Rendering with playbooks:", playbooks);
    console.log("📊 Playbooks.tsx - Playbooks length:", playbooks.length);
    console.log("📊 Playbooks.tsx - Loading:", loading, "Error:", error);

    // Monitor changes to playbooks array
    useEffect(() => {
        console.log("✨ Playbooks.tsx - useEffect triggered! Playbooks changed to:", playbooks);
        console.log("✨ Playbooks.tsx - New length:", playbooks.length);
    }, [playbooks]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPlaybook, setEditingPlaybook] = useState<PlaybookDoc | null>(
        null
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        content: "",
        category: "onboarding",
        tags: [] as string[],
        version: "1.0",
    });

    // Filtrar playbooks
    const filteredPlaybooks = playbooks.filter((playbook) => {
        const matchesSearch =
            playbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            playbook.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "all" || playbook.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    console.log("📊 Playbooks.tsx - Filtered playbooks:", filteredPlaybooks);
    console.log("📊 Playbooks.tsx - Filtered length:", filteredPlaybooks.length);
    console.log("📊 Playbooks.tsx - Search query:", searchQuery, "Category:", selectedCategory);

    // Stats
    const stats = {
        total: playbooks.length,
        byCategory: CATEGORIES.slice(1).map((cat) => ({
            category: cat.label,
            count: playbooks.filter((p) => p.category === cat.value).length,
        })),
        totalViews: playbooks.reduce((sum, p) => sum + (p.views || 0), 0),
    };

    console.log("📊 Playbooks.tsx - Stats:", stats);

    // Criar playbook
    const handleCreatePlaybook = async () => {
        if (!formData.name) {
            toast.error("Nome do playbook é obrigatório");
            return;
        }

        const result = await createPlaybook({
            name: formData.name,
            description: formData.description,
            content: formData.content,
            category: formData.category,
            tags: formData.tags,
            version: formData.version,
            author: "", // Will be set by backend
            is_active: true,
        });

        if (result) {
            setIsCreateOpen(false);
            setFormData({
                name: "",
                description: "",
                content: "",
                category: "onboarding",
                tags: [],
                version: "1.0",
            });
            toast.success("Playbook criado com sucesso!");
        } else {
            toast.error("Erro ao criar playbook");
        }
    };

    // Editar playbook
    const handleEditPlaybook = async () => {
        if (!editingPlaybook) return;

        try {
            await updatePlaybook(editingPlaybook.id, {
                name: formData.name,
                description: formData.description,
                content: formData.content,
                category: formData.category,
                tags: formData.tags,
                version: formData.version,
            });
            setIsEditOpen(false);
            setEditingPlaybook(null);
            toast.success("Playbook atualizado com sucesso!");
        } catch (err) {
            toast.error("Erro ao atualizar playbook");
        }
    };

    // Deletar playbook
    const handleDeletePlaybook = async (id: string) => {
        if (!confirm("Tem certeza que deseja deletar este playbook?")) return;

        try {
            await deletePlaybook(id);
            toast.success("Playbook deletado com sucesso!");
        } catch (err) {
            toast.error("Erro ao deletar playbook");
        }
    };

    // Abrir dialog de edição
    const openEditDialog = (playbook: PlaybookDoc) => {
        setEditingPlaybook(playbook);
        setFormData({
            name: playbook.name,
            description: playbook.description || "",
            content: playbook.content || "",
            category: playbook.category || "onboarding",
            tags: playbook.tags || [],
            version: playbook.version || "1.0",
        });
        setIsEditOpen(true);
    };

    if (loading && playbooks.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Carregando playbooks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Playbooks</h1>
                    <p className="text-muted-foreground mt-1">
                        Base de conhecimento e documentação
                    </p>
                </div>

                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Playbook
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar playbooks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground">Total Playbooks</p>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground">Onboarding</p>
                    <p className="text-3xl font-bold mt-2 text-blue-600">
                        {playbooks.filter((p) => p.category === "onboarding").length}
                    </p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground">Renovação</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                        {playbooks.filter((p) => p.category === "renewal").length}
                    </p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground">Total Visualizações</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalViews}</p>
                </Card>
            </div>

            {/* Playbooks Grid */}
            {error && (
                <div className="text-center py-8 text-red-600">
                    <p>{error}</p>
                </div>
            )}

            {filteredPlaybooks.length === 0 && !error ? (
                <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {searchQuery || selectedCategory !== "all"
                            ? "Nenhum playbook encontrado com os filtros aplicados"
                            : "Nenhum playbook criado ainda"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlaybooks.map((playbook) => (
                        <Card key={playbook.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditDialog(playbook)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePlaybook(playbook.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-2">{playbook.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {playbook.description}
                            </p>

                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {playbook.category && (
                                    <Badge variant="secondary">{playbook.category}</Badge>
                                )}
                                {playbook.tags?.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {playbook.views || 0} views
                                </span>
                                <span>v{playbook.version}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Playbook</DialogTitle>
                        <DialogDescription>
                            Adicione um novo documento à base de conhecimento
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Playbook *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Ex: Processo de Onboarding"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Breve descrição do playbook..."
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.slice(1).map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData({ ...formData, content: e.target.value })
                                }
                                placeholder="Conteúdo do playbook (suporta Markdown)..."
                                rows={6}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreatePlaybook}>Criar Playbook</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Editar Playbook</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do playbook
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nome do Playbook *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Descrição</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.slice(1).map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-content">Conteúdo</Label>
                            <Textarea
                                id="edit-content"
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData({ ...formData, content: e.target.value })
                                }
                                rows={6}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditPlaybook}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
