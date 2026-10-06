import { useRef, useState, type DragEvent } from 'react';

function carriesFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes('Files');
}

/**
 * Makes an element a drop target for files. Spread `dropHandlers` on it;
 * `isDragging` is true while a file is held over it.
 *
 * Drags that carry no files (selected text, an image dragged from the page)
 * are ignored, so the zone doesn't light up for something it can't take.
 */
export function useFileDrop(onFiles: (files: FileList) => void) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave fire for every child element the pointer crosses, so
  // a boolean would flicker; the zone is only left once the depth is back to 0.
  const dragDepth = useRef(0);

  const dropHandlers = {
    onDragEnter: (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      // Without this the browser refuses the drop and opens the file instead.
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      onFiles(event.dataTransfer.files);
    },
  };

  return { isDragging, dropHandlers };
}
