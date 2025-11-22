    if (!user.organizationId) return;
    const orgUsers = getUsersByOrganization(user.organizationId);
    const admins = orgUsers.filter(u => u.role === UserRole.ORG_ADMIN);

    if (user.role === UserRole.ORG_ADMIN && admins.length === 1) {
      toast.error("Não é possível excluir o último administrador da organização");
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      deleteUser(user.id);
      toast.success("Usuário excluído com sucesso!");
    }
  };

  const openAddUserDialog = () => {
    setUserFormData({ name: "", email: "", password: "", role: UserRole.CSM });
    setIsAddUserDialogOpen(true);