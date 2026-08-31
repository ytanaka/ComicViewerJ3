import { Settings, Zap } from "lucide-react";

import { Dialog, DialogContent } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { useUiStore } from "@/store/ui-store";
import { GeneralPane } from "./GeneralPane";
import { AdvancedPane } from "./AdvancedPane";


const paneList = [
  {
    id: 'general' as const,
    label: '基本',
    icon: Settings,
    node: GeneralPane
  },
  {
    id: 'advanced' as const,
    label: '高度な設定',
    icon: Zap,
    node: AdvancedPane
  },
] as const;

export function PreferencesDialog() {
  const showPreferencesDialog = useUiStore(state => state.showPreferencesDialog);
  const setShowPreferencesDialog = useUiStore(state => state.setShowPreferencesDialog);

  return (
    <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
      <DialogContent className="max-w-[90%] max-h-[90%]">
        <div className="flex">
          <Tabs orientation='vertical'>
            <TabsList>
              {paneList.map(item => (
                <TabsTrigger key={item.id} value={item.id}
                >
                  <item.icon />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {paneList.map(item => (
              <TabsContent key={item.id} value={item.id}>
                <item.node />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog >
  )
}
