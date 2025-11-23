import { useState } from "react";
import { useLocation } from "wouter";
import { usePlaybooksContext } from "@/contexts/PlaybooksContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen, Eye, Clock, MoreVertical, Edit, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Playbooks() {
    const [location, setLocation] = useLocation();
    const { playbooks, loading, deletePlaybook } = usePlaybooksContext();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPlaybooks = playbooks.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este playbook?")) {
            await deletePlaybook(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Playbooks</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie e acesse os processos e melhores práticas da sua empresa.
                    </p>
                </div>
                <Button onClick={() => setLocation("/playbooks/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Playbook
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar playbooks por nome, descrição ou categoria..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-10">Carregando playbooks...</div>
            ) : filteredPlaybooks.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/10">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum playbook encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                        Comece criando seu primeiro playbook para documentar processos.
                    </p>
                    <Button onClick={() => setLocation("/playbooks/new")}>
                        Criar Playbook
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlaybooks.map((playbook) => (
                        <Card
                            key={playbook.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => setLocation(`/playbooks/${playbook.id}`)}
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="mb-2">
                                        {playbook.category}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/playbooks/${playbook.id}/edit`); }}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(playbook.id, e)}>
                                                <Trash className="w-4 h-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="line-clamp-1">{playbook.name}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10">
                                    {playbook.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {playbook.tags?.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {playbook.tags?.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{playbook.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="text-xs text-muted-foreground border-t pt-4 flex justify-between">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {playbook.updatedAt && formatDistanceToNow(new Date(playbook.updatedAt), { addSuffix: true, locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {playbook.views}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
