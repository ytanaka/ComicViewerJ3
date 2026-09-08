import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppPreferences } from '../lib/bindings';
import { handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';

const preferencesQueryKey = 'preferences';

export function usePreferences() {
  return useQuery({
    queryKey: [preferencesQueryKey],
    queryFn: async (): Promise<AppPreferences> => {
      const result = await rustcmds.loadPreferences();
      if (result.status === 'error') {
        return { debug_filename_search_sleep_ms: 0 };
      }
      return result.data;
    },
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: AppPreferences) => {
      const result = await rustcmds.savePreferences(preferences);
      handleRustCmdResult(result, 'rustcmds.savePreferences()', '設定ファイル保存失敗');
      if (result.status === 'error') {
        throw new Error(result.error);
      }
    },
    onSuccess: (_, preferences) => {
      queryClient.setQueryData([preferencesQueryKey], preferences);
    },
  });
}
