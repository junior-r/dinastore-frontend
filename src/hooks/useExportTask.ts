import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/queries/error-message';

interface TaskMessages {
  pending: string;
  success: string;
  error: string;
}

/**
 * Runs one export (a spreadsheet, a chart image) at a time.
 *
 * The work is asynchronous, so the page stays usable while it runs. What this
 * adds is the other half: a loading toast so the person knows it is being
 * prepared, and `busy` so every export button can be disabled until it is
 * done. Clicking again while one is running does nothing, rather than queuing
 * a second copy of the same file.
 */
export function useExportTask() {
  // Which export is running, so its own button can show a spinner.
  const [running, setRunning] = useState<string | null>(null);
  // State only updates on the next render; the ref closes the gap in which a
  // fast double click would otherwise start the task twice.
  const locked = useRef(false);

  const run = useCallback(async (id: string, task: () => Promise<void>, messages: TaskMessages) => {
    if (locked.current) {
      return;
    }
    locked.current = true;
    setRunning(id);
    const toastId = toast.loading(messages.pending);

    try {
      await task();
      toast.success(messages.success, { id: toastId });
    } catch (error) {
      toast.error(errorMessage(error, messages.error), { id: toastId });
    } finally {
      locked.current = false;
      setRunning(null);
    }
  }, []);

  return { running, busy: running !== null, run };
}
