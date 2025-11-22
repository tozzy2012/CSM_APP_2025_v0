
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "todo":
        return "outline";
      case "cancelled":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
        isOverdue ? "border-red-500 bg-red-50 dark:bg-red-950" : "border-border"
      } ${task.status === "completed" ? "opacity-75" : ""}`}
    >
      {/* Header - Cliente como informação principal */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 mt-1.5`} />
          <div className="flex-1 min-w-0">
            {/* CLIENTE - Informação Principal */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-foreground">
                {accountName || "Sem cliente"}
              </h3>
              <Badge variant="outline" className="text-xs">
                {getPriorityLabel(task.priority)}
              </Badge>
              {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
            </div>
            {/* AÇÃO - Informação Secundária */}
            <p className={`text-sm text-muted-foreground ${task.status === "completed" ? "line-through" : ""}`}>
              {task.title}
            </p>
            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </div>
              {assigneeName && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {assigneeName}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(task)}
            >
              Editar
            </Button>
          )}