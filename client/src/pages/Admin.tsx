import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const Admin: React.FC = () => {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin (stub)</CardTitle>
          <CardDescription>
            Esta tela ainda será ligada ao backend e ao desenho completo do
            Manus. Por enquanto, é apenas um placeholder válido para compilar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aqui depois vamos listar organizações, admins globais etc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
