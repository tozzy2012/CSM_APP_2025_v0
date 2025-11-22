import * as React from "react";

type EditTaskDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  task?: any;
  onTaskUpdated?: (task: any) => void;
};

const EditTaskDialog: React.FC<
  React.PropsWithChildren<EditTaskDialogProps>
> = ({ children }) => {
  // TODO: implementar diálogo real de edição de tarefa
  return <>{children}</>;
};

export default EditTaskDialog;
