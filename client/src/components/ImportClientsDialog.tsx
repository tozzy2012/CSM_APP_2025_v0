import * as React from "react";

interface ImportClientsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImported?: () => void;
}

const ImportClientsDialog: React.FC<ImportClientsDialogProps> = ({ children }) => {
  // TODO: implementar upload CSV / integração real
  return <>{children}</>;
};

export default ImportClientsDialog;
