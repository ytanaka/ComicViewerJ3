import { Info, Settings, Settings2, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { useUiStore } from '@/store/ui-store';
import { GeneralPanel } from './panels/GeneralPanel';
import { DebugPane as DebugPanel } from './panels/DebugPanel';
import { AboutPane as AboutPanel } from './panels/AboutPanel';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { AdvancedPane as AdvancedPanel } from './panels/AdvancedPanel';
import { DebugCmdPane as DebugCmdPanel } from './panels/DebugCmdPanel';
import { FileListPanel } from './panels/FileListPanel';

const allPanelList = [
  {
    id: 'general',
    label: '基本',
    icon: Settings2,
    node: GeneralPanel,
  },
  {
    id: 'fileList',
    label: 'ファイル一覧',
    icon: Settings2,
    node: FileListPanel,
  },
  {
    id: 'advanced',
    label: '高度な設定',
    icon: Settings,
    node: AdvancedPanel,
  },
  {
    id: 'debug',
    label: 'デバッグ用設定',
    icon: Zap,
    node: DebugPanel,
  },
  {
    id: 'debugCmd',
    label: 'デバッグ用コマンド',
    icon: Zap,
    node: DebugCmdPanel,
  },
  {
    id: 'about',
    label: 'アプリについて',
    icon: Info,
    node: AboutPanel,
  },
] as const;

export type PanelProp = (typeof allPanelList)[number];
export type PreferenceDialogTabId = PanelProp['id'];

export function PreferencesDialog() {
  const showPreferencesDialog = useUiVolatileStore(state => state.showPreferencesDialog);
  const setShowPreferencesDialog = useUiVolatileStore(state => state.setShowPreferencesDialog);

  const preferenceDialogTabId = useUiVolatileStore(state => state.preferenceDialogTabId);
  const setPreferenceDialogTabId = useUiVolatileStore(state => state.setPreferenceDialogTabId);

  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);

  const panelList = allPanelList.filter(p => !p.id.startsWith('debug') || debugPreferenceOn);

  return (
    <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none sm:max-w-none">
        <div>
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
          </DialogHeader>
          <Tabs
            value={preferenceDialogTabId}
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
