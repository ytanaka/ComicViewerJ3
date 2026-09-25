import { Info, Settings, Settings2, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { useUiStore } from '@/store/ui-store';
import { GeneralPanel } from './panels/GeneralPanel';
import { DebugPanel } from './panels/DebugPanel';
import { AboutPanel } from './panels/AboutPanel';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { DebugCmdPanel } from './panels/DebugCmdPanel';
import { FileListPanel } from './panels/FileListPanel';
import { DebugPanel2 } from './panels/DebugPanel2';
import { FileSearchPanel } from './panels/FileSearchPanel';
import { ImageViewPanel } from './panels/ImageViewPanel';
import { SystemPanel } from './panels/SystemPanel';
import { ImageQuorityPanel } from './panels/ImageQuorityPanel';
import { InvokeAppPanel } from './panels/InvokeApp';

const allPanelList = [
  {
    id: 'general',
    label: '基本',
    icon: Settings2,
    node: GeneralPanel,
  },
  {
    id: 'fileSearch',
    label: 'ファイル検索',
    icon: Settings2,
    node: FileSearchPanel,
  },
  {
    id: 'invokeApp',
    label: 'アプリ起動',
    icon: Settings2,
    node: InvokeAppPanel,
  },
  {
    id: 'fileList',
    label: 'ファイル一覧表示',
    icon: Settings2,
    node: FileListPanel,
  },
  {
    id: 'imageView',
    label: '画像表示画面',
    icon: Settings,
    node: ImageViewPanel,
  },
  {
    id: 'imageQuority',
    label: '画質',
    icon: Settings,
    node: ImageQuorityPanel,
  },
  {
    id: 'system',
    label: 'システム',
    icon: Settings,
    node: SystemPanel,
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
  const setVolatileField = useUiVolatileStore(state => state.setField);
  const preferenceDialogTabId = useUiStore(state => state.preferenceDialogTabId);
  const setField = useUiStore(state => state.setField);

  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);

  const panelList = allPanelList.filter(p => !p.id.startsWith('debug') || debugPreferenceOn);

  // このダイアログのスタイル設定はAIが決めたのでよくわからない。変更するときは以下をコピペしてAIに聞く。
  // 手動で変更しようとすると、ダイアログのサイズが変になったり、コンテンツがやたら小さくなったりしてどうにもならない。
  return (
    <Dialog open={showPreferencesDialog} onOpenChange={b => setVolatileField('showPreferencesDialog', b)}>
      <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh] max-h-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <Tabs
          value={preferenceDialogTabId}
          onValueChange={v => setField('preferenceDialogTabId', v)}
          orientation="vertical"
          className="flex flex-1 overflow-hidden"
        >
          <TabsList className="w-48 shrink-0">
            {panelList.map(item => (
              <TabsTrigger key={item.id} value={item.id}>
                <item.icon />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {panelList.map(item => (
            <TabsContent key={item.id} value={item.id} className="overflow-auto h-full pl-2">
              <item.node />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
