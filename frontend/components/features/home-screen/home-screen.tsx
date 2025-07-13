"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shared/ui/tabs";
import { AppHeader } from "@/components/shared/layout/app-header/app-header";
import { MonitoringTab } from "@/components/features/monitoring/monitoring-tab";
import { DashboardTab } from "@/components/features/dashboard/dashboard-tab";
import { ViolationListTab } from "@/components/features/violations/violation-list-tab/components/violation-list-tab";
import { ManageOfficers } from "@/components/features/manage-officers/components/manage-officers";
import { useToast } from "@/components/shared/hooks/use-toast";
import { useAuth } from "@/components/shared/hooks/use_auth";
import { logout } from "@/lib/api/v1/auth";
import { hasPermission } from "@/lib/rbac"
interface HomeScreenProps {
  onLogout: () => void;
}

export function HomeScreen({ onLogout }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState("monitoring");
  const { toast } = useToast();

  const { user, setUser } = useAuth(() => {
    handleLogout("Your session has expired");
  });

  const handleLogout = (
    description = "You have been successfully logged out"
  ) => {
    try {
      logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      toast({
        title: "Logged out",
        description,
      });
      onLogout();
    }
  };

  if (!user) return null;

  const showOfficerTab = hasPermission(user.role, "officer:view");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-start mb-6">
            <TabsList className="inline-flex bg-muted rounded-lg p-1 shadow-sm">
              <TabsTrigger value="monitoring" className={tabTriggerClass}>
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="dashboard" className={tabTriggerClass}>
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="violations" className={tabTriggerClass}>
                Violation List
              </TabsTrigger>
              {showOfficerTab && (
                <TabsTrigger value="manage-officers" className={tabTriggerClass}>
                  Manage Officers
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="monitoring" className="mt-4">
            <MonitoringTab />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="violations" className="mt-4">
            <ViolationListTab />
          </TabsContent>

          {showOfficerTab && (
            <TabsContent value="manage-officers" className="mt-4">
              <ManageOfficers />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

const tabTriggerClass =
  "px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 " +
  "data-[state=active]:bg-background data-[state=active]:text-foreground " +
  "data-[state=inactive]:text-muted-foreground";

