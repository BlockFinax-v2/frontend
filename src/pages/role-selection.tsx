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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Building2, 
  Truck, 
  Scale, 
  Banknote,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { logoPath } from "@/assets";

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
    onSuccess: (_, role) => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-xl border-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto p-2 bg-primary/10 rounded-full flex items-center justify-center">
                <img 
                  src={logoPath} 
                  alt="BlockFinaX Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <div className="text-lg font-semibold mb-2">Loading Your Profile</div>
                <div className="text-sm text-muted-foreground">Checking your account details...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <div className="pt-6 pb-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/wallet')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallet
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
            <img 
              src={logoPath} 
              alt="BlockFinaX Logo" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Choose Your Business Role
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
            Select your primary business role to access tailored features and dashboards. 
            You can always change this later in your account settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 shadow-lg ${
                  isSelected ? 'ring-4 ring-primary/20 shadow-2xl scale-105 bg-gradient-to-br from-primary/5 to-primary/10' : 'hover:shadow-xl'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2 text-gray-900 dark:text-white">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      Key Features:
                    </h4>
                    <ul className="space-y-2">
                      {role.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-1.5 shrink-0"></div>
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
          <div className="text-center mb-8">
            <Card className="max-w-lg mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                    Confirm Your Selection
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-gray-600 dark:text-gray-300">You've selected</span>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {roleOptions.find(r => r.id === selectedRole)?.title}
                    </Badge>
                  </div>
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 mb-4">
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      This will set up your dashboard with role-specific features and tools.
                    </AlertDescription>
                  </Alert>
                </div>
                
                <Button 
                  onClick={() => handleRoleSelection(selectedRole)}
                  disabled={setRoleMutation.isPending}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {setRoleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Setting up your account...
                    </>
                  ) : (
                    <>
                      Continue as {roleOptions.find(r => r.id === selectedRole)?.title}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center pb-8">
          <Card className="max-w-md mx-auto bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connected as: <br />
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                  {wallet?.address}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}