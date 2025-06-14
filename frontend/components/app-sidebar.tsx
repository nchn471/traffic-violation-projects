"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Monitor, LayoutDashboard, FileText, Camera, LogOut, User } from "lucide-react"

interface AppSidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
  user: { name: string; role: string } | null
  onLogout: () => void
}

export function AppSidebar({ currentTab, onTabChange, user, onLogout }: AppSidebarProps) {
  const menuItems = [
    {
      id: "monitoring",
      title: "Monitoring",
      icon: Monitor,
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "violations",
      title: "Danh sách vi phạm",
      icon: FileText,
    },
  ]

  return (
    <Sidebar className="theme-transition">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="gradient-bg p-2 rounded-lg">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">CSGT System</h2>
            <p className="text-sm text-muted-foreground">Vi phạm giao thông</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentTab === item.id}
                    onClick={() => onTabChange(item.id)}
                    className="theme-transition"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="gradient-bg text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onLogout} className="w-full theme-transition justify-start">
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
