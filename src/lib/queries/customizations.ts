import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import type { DesignCrop } from '../types';
import { getStudioConfig, uploadDesign } from '../api/customizations';
import { errorMessage } from './error-message';

export function useStudioConfig() {
  return useQuery({
    queryKey: ['customizations', 'config'],
    queryFn: getStudioConfig,
    // The logo and the upload rules only change with a deploy.
    staleTime: 10 * 60_000,
  });
}

export function useUploadDesign() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const t = useTranslation();

  return useMutation({
    mutationFn: ({ file, crop }: { file: File; crop?: DesignCrop | null }) =>
      uploadDesign(file, accessToken as string, crop),
    onError: (error) => {
      toast.error(errorMessage(error, t.customize.uploadFailed));
    },
  });
}
