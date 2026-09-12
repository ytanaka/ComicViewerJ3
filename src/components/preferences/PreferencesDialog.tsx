import { Info, Settings, Settings2, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { useUiStore } from '@/store/ui-store';
import { GeneralPanel } from './panels/GeneralPanel';
import { DebugPanel } from './panels/DebugPanel';
import { AboutPanel } from './panels/AboutPanel';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { AdvancedPanel } from './panels/AdvancedPanel';
import { DebugCmdPanel } from './panels/DebugCmdPanel';
import { FileListPanel } from './panels/FileListPanel';
import { DebugPanel2 } from './panels/DebugPanel2';

const allPanelList = [
  {
    id: 'general',
    label: '基本設定',
    icon: Settings2,
    node: GeneralPanel,
  },
  {
    id: 'fileList',
    label: 'ファイル一覧表示',
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
    id: 'debug2',
    label: 'デバッグ用設定2',
    icon: Zap,
    node: DebugPanel2,
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
  const preferenceDialogTabId = useUiVolatileStore(state => state.preferenceDialogTabId);
  const setField = useUiVolatileStore(state => state.setField);

  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);

  const panelList = allPanelList.filter(p => !p.id.startsWith('debug') || debugPreferenceOn);

  return (
    <Dialog open={showPreferencesDialog} onOpenChange={b => setField('showPreferencesDialog', b)}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none sm:max-w-none">
        <div>
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
          </DialogHeader>
          <Tabs
            value={preferenceDialogTabId}
            onValueChange={v => setField('preferenceDialogTabId', v)}
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
