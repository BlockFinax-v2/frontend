/**
 * Admin Navigation Component
 * 
 * Navigation between different admin dashboards
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Shield, Users, BarChart3, Settings, FileText } from "lucide-react";

export default function AdminNav() {
  const [location] = useLocation();

  const navItems = [
    {
      title: "Communication Platform",
      description: "Messaging & wallet analytics",
      href: "/admin",
      icon: Users,
      active: location === "/admin"
    },
    {
      title: "BlockFinaX Escrow Platform",
      description: "Self-custody escrow monitoring",
      href: "/escrow-admin",
      icon: Shield,
      active: location === "/escrow-admin"
    },
    {
      title: "Contract Management",
      description: "Draft contracts with deliverables & signatures",
      href: "/contracts",
      icon: FileText,
      active: location === "/contracts"
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground">
          Choose your dashboard to monitor platform activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={`cursor-pointer transition-all hover:shadow-lg ${
              item.active ? 'ring-2 ring-primary' : ''
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={item.active ? "default" : "outline"} className="w-full">
                  {item.active ? "Current Dashboard" : "Access Dashboard"}
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}