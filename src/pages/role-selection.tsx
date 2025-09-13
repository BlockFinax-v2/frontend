/**
 * Role Selection Page
 * 
 * Allows users to select their business role after wallet authentication.
 * Manages role assignment and redirects to appropriate dashboard.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, 
  Truck, 
  Scale, 
  Banknote,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface RoleOption {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: any;
  dashboardPath: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "exporter",
    title: "Exporter",
    description: "Sell goods internationally with secure payment guarantees",
    features: [
      "Create export contracts",
      "Manage international shipments", 
      "Access trade finance pools",
      "Document verification",
      "Payment protection"
    ],
    icon: Truck,
    dashboardPath: "/exporter-dashboard"
  },
  {
    id: "importer", 
    title: "Importer",
    description: "Source products globally with payment security",
    features: [
      "Browse verified suppliers",
      "Secure payment escrow",
      "Track shipment status",
      "Quality assurance",
      "Dispute resolution"
    ],
    icon: Building2,
    dashboardPath: "/importer-dashboard"
  },
  {
    id: "arbitrator",
    title: "Arbitrator", 
    description: "Resolve trade disputes and verify transactions",
    features: [
      "Review dispute cases",
      "Access case documentation",
      "Make binding decisions",
      "Earn arbitration fees",
      "Maintain reputation score"
    ],
    icon: Scale,
    dashboardPath: "/arbitrator-dashboard"
  },
  {
    id: "financier",
    title: "Financier",
    description: "Provide trade finance and earn returns",
    features: [
      "Create funding pools",
      "Evaluate trade deals",
      "Monitor investments",
      "Automated returns",
      "Risk analytics"
    ],
    icon: Banknote,
    dashboardPath: "/financier-dashboard"
  }
];

export default function RoleSelection() {
  const { wallet } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Check if user already has a role
  const { data: userRole, isLoading } = useQuery({
    queryKey: ['/api/user/role', wallet?.address],
    enabled: !!wallet?.address
  });

  // Mutation to set user role
  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await fetch(`/api/user/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet?.address,
          role: role
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign role');
      }
      
      return await response.json();
    },
    onSuccess: (data, role) => {
      toast({
        title: "Role assigned successfully",
        description: `You are now registered as a ${role}.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/role'] });
      
      // Redirect to appropriate dashboard
      const roleOption = roleOptions.find(r => r.id === role);
      if (roleOption) {
        setLocation(roleOption.dashboardPath);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign role",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // If user already has a role, redirect them
  if (userRole && !isLoading) {
    const roleOption = roleOptions.find(r => r.id === (userRole as any).role);
    if (roleOption) {
      setLocation(roleOption.dashboardPath);
      return null;
    }
  }

  const handleRoleSelection = (role: string) => {
    if (!wallet?.address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    setRoleMutation.mutate(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading...</div>
          <div className="text-sm text-muted-foreground">Checking your account</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Business Role</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your primary business role to access tailored features and dashboards. 
            You can always change this later in your account settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Features:</h4>
                    <ul className="space-y-1">
                      {role.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center">
                          <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedRole && (
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Confirm Your Selection</h3>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <span>You've selected</span>
                    <Badge variant="outline">{roleOptions.find(r => r.id === selectedRole)?.title}</Badge>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleRoleSelection(selectedRole)}
                  disabled={setRoleMutation.isPending}
                  className="w-full"
                >
                  {setRoleMutation.isPending ? (
                    "Setting up your account..."
                  ) : (
                    <>
                      Continue as {roleOptions.find(r => r.id === selectedRole)?.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Connected as: <span className="font-mono">{wallet?.address}</span>
          </p>
        </div>
      </div>
    </div>
  );
}