"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;

  exportText: string;
  importText: string;

  onExport: () => void;
  onReset: () => void;

  onImportTextChange: (next: string) => void;
  onImportApply: (text: string) => void;
  onClearImport: () => void;
};

export default function OptionsModal({
  open,
  onClose,
  exportText,
  importText,
  onExport,
  onReset,
  onImportTextChange,
  onImportApply,
  onClearImport
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function onBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(file: File | null) {
    if (!file) return;

    const text = await file.text();
    onImportTextChange(text);

    try {
      onImportApply(text);
      alert("Imported.");
    } catch (err: any) {
      alert(String(err?.message ?? err));
    }
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" onMouseDown={onBackdropMouseDown} role="dialog" aria-modal="true" aria-label="Options">
      <div className="modalPanel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalTitle">Options</div>

        <div className="modalRow">
          <button className="primary" onClick={onExport}>
            Export JSON
          </button>

          <button onClick={onPickFile}>Import file</button>

          <button onClick={onReset}>Reset</button>

          <button onClick={onClose}>Close</button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="small">Exported JSON</div>
        <textarea value={exportText} readOnly placeholder="Export will appear here..." />

        <div className="small">Paste JSON and apply</div>
        <textarea value={importText} onChange={(e) => onImportTextChange(e.target.value)} placeholder="Paste JSON here..." />

        <div className="modalRow">
          <button
            className="primary"
            onClick={() => {
              try {
                onImportApply(importText);
                alert("Imported.");
              } catch (err: any) {
                alert(String(err?.message ?? err));
              }
            }}
            disabled={!importText.trim()}
          >
            Apply
          </button>

          <button onClick={onClearImport}>Clear</button>
        </div>
      </div>
    </div>
  );
}
