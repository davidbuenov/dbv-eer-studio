import { useState } from 'react';

/**
 * Hook para manejar operaciones de archivos (Open, Save, Save As)
 */
export function useFileOperations() {
  const [lastFileHandle, setLastFileHandle] = useState<unknown | null>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const handleOpenFile = async (onCodeLoaded: (code: string) => void) => {
    try {
      const picker = (window as unknown as { showOpenFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker;
      const handles = picker ? await picker({
        types: [{ description: 'EER Files', accept: { 'text/plain': ['.eer'] } }],
        multiple: false,
      }) : [];
      const handle = handles && handles[0];
      
      if (handle) {
        const file = await (handle as unknown as { getFile: () => Promise<File> }).getFile();
        const text = await file.text();
        onCodeLoaded(text);
        setLastFileHandle(handle);
      } else {
        // Fallback para navegadores sin File System Access API
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.eer,text/plain';
        input.onchange = async () => {
          const f = (input.files && input.files[0]) || null;
          if (!f) return;
          const text = await f.text();
          onCodeLoaded(text);
        };
        input.click();
      }
    } finally {
      setShowFileMenu(false);
    }
  };

  const saveToHandle = async (handle: unknown, content: string) => {
    const writable = await (handle as unknown as { createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void>; }> }).createWritable();
    await writable.write(content);
    await writable.close();
  };

  const handleSaveFile = async (code: string) => {
    try {
      if (lastFileHandle) {
        await saveToHandle(lastFileHandle, code);
      } else {
        await handleSaveAsFile(code);
      }
    } finally {
      setShowFileMenu(false);
    }
  };

  const handleSaveAsFile = async (code: string) => {
    try {
      const picker = (window as unknown as { showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
      const handle = picker ? await picker({
        types: [{ description: 'EER Files', accept: { 'text/plain': ['.eer'] } }],
        suggestedName: 'diagram.eer',
      }) : null;
      
      if (handle) {
        await saveToHandle(handle, code);
        setLastFileHandle(handle);
      } else {
        // Fallback para navegadores sin File System Access API
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.eer';
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setShowFileMenu(false);
    }
  };

  return {
    lastFileHandle,
    showFileMenu,
    setShowFileMenu,
    handleOpenFile,
    handleSaveFile,
    handleSaveAsFile
  };
}
