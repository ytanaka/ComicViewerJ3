import { Settings, Zap } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { useUiStore } from "@/store/ui-store";
import { GeneralPane } from "./panels/GeneralPane";
import { DebugPane } from "./panels/DebugPanel";

const panelList = [
  {
    id: 'general' as const,
    label: '基本',
    icon: Settings,
    node: GeneralPane
  },
  {
    id: 'debug' as const,
    label: 'デバッグ用設定',
    icon: Zap,
    node: DebugPane
  },
] as const;

export function PreferencesDialog() {
  const showPreferencesDialog = useUiStore(state => state.showPreferencesDialog);
  const setShowPreferencesDialog = useUiStore(state => state.setShowPreferencesDialog);

  return (
    <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
      {/* <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none sm:max-w-none"> */}
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none sm:max-w-none">
        <div>
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
          </DialogHeader>
          <Tabs className='pt-2' orientation='vertical'>
            <TabsList>
              {panelList.map(item => (
                <TabsTrigger key={item.id} value={item.id}
                >
                  <item.icon />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {panelList.map(item => (
              <TabsContent key={item.id} value={item.id} className='flex-1'>
                <item.node />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog >
  )
}
