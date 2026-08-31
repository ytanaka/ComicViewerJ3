import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppPreferences, commands } from '../lib/bindings'

const preferencesQueryKey = 'preferences';

export function usePreferences() {
  return useQuery({
    queryKey: [preferencesQueryKey],
    queryFn: async (): Promise<AppPreferences> => {
      const result = await commands.loadPreferences()
      if (result.status === 'error') {
        return { debug_filename_search_sleep_ms: 0 }
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: AppPreferences) => {
      const result = await commands.savePreferences(preferences)
      if (result.status === 'error') {
        throw new Error(result.error)
      }
    },
    onSuccess: (_, preferences) => {
      queryClient.setQueryData([preferencesQueryKey], preferences)
    },
  })
}
