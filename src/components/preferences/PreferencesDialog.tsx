import { useState } from "react";
import { Settings, Zap } from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import { Dialog, DialogContent } from "../ui/dialog";
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "../ui/sidebar";
import { GeneralPane } from "./GeneralPane";
import { AdvancedPane } from "./AdvancedPane";

type PreferencePane = 'general' | 'advanced';

const navigationItems = [
  {
    id: 'general' as const,
    label: '基本',
    icon: Settings,
  },
  {
    id: 'advanced' as const,
    label: '高度な設定',
    icon: Zap,
  },
] as const;

export function PreferencesDialog() {
  const [activePane, setActivePane] = useState<PreferencePane>('general')
  const showPreferencesDialog = useUiStore(state => state.showPreferencesDialog);
  const setShowPreferencesDialog = useUiStore(state => state.setShowPreferencesDialog);

  return (
    <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
      <DialogContent className="max-w-[90%] max-h-[90%]">
        <SidebarProvider >
          <Sidebar className="h-full">
            <SidebarContent>
              <SidebarMenu>
                {navigationItems.map(item => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activePane === item.id}
                    >
                      <button
                        onClick={() => setActivePane(item.id)}
                        className="flex items-center"
                      >
                        <item.icon />
                        <span className="pl-1">{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <main>
            <div>
              {activePane === 'general' && <GeneralPane />}
              {activePane === 'advanced' && <AdvancedPane />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog >
  )
}
