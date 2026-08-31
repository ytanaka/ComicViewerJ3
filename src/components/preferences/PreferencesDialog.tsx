import { Info, Settings, Settings2, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { useUiStore } from '@/store/ui-store';
import { GeneralPane } from './panels/GeneralPane';
import { DebugPane } from './panels/DebugPanel';
import { AboutPane } from './panels/AboutPanel';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { AdvancedPane } from './panels/AdvancedPanel';

export type PreferenceDialogTabId = 'general' | 'advanced' | 'debug' | 'about';

export interface PanelProp {
  id: PreferenceDialogTabId;
  label: string;
  icon: typeof Settings;
  node: typeof GeneralPane;
}

const allPanelList: PanelProp[] = [
  {
    id: 'general',
    label: '基本',
    icon: Settings2,
    node: GeneralPane,
  },
  {
    id: 'advanced',
    label: '高度な設定',
    icon: Settings,
    node: AdvancedPane,
  },
  {
    id: 'debug',
    label: 'デバッグ用設定',
    icon: Zap,
    node: DebugPane,
  },
  {
    id: 'about',
    label: 'アプリについて',
    icon: Info,
    node: AboutPane,
  },
];

export function PreferencesDialog() {
  const showPreferencesDialog = useUiVolatileStore(state => state.showPreferencesDialog);
  const setShowPreferencesDialog = useUiVolatileStore(state => state.setShowPreferencesDialog);

  const preferenceDialogTabId = useUiVolatileStore(state => state.preferenceDialogTabId);
  const setPreferenceDialogTabId = useUiVolatileStore(state => state.setPreferenceDialogTabId);

  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);

  const panelList = allPanelList.filter(p => p.id !== 'debug' || debugPreferenceOn);

  return (
    <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none sm:max-w-none">
        <div>
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue={preferenceDialogTabId}
            onValueChange={setPreferenceDialogTabId}
            className="pt-3"
            orientation="vertical"
          >
            <TabsList>
              {panelList.map(item => (
                <TabsTrigger key={item.id} value={item.id}>
                  <item.icon />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {panelList.map(item => (
              <TabsContent key={item.id} value={item.id} className="flex-1 pl-2">
                <item.node />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
