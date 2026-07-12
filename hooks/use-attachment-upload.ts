"use client";

import { useCallback, useMemo, useState } from "react";

export function useAttachmentUpload() {
  const [isOpen, setOpen] = useState(false);
  const [stageUrl, setStagedUrl] = useState<null | string>(null);
  const [isUploading, setUploading] = useState(false);

  const onUploaded = useCallback((url: string) => {
    setStagedUrl(url);
    setUploading(false);
    setOpen(false);
  }, []);

  const clear = useCallback(() => {
    setStagedUrl(null);
    setUploading(false);
  }, []);

  return useMemo(
    () => ({
      isOpen,
      setOpen,
      onUploaded,
      stageUrl,
      isUploading,
      clear,
    }),
    [isOpen, setOpen, onUploaded, stageUrl, isUploading, clear],
  );
}

export type UseAttachmentUploadType = ReturnType<typeof useAttachmentUpload>;
