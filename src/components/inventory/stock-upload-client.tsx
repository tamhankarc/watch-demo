"use client";

import { useState } from "react";

type PreviewRow = {
  rowNumber: number;
  brand: string;
  model: string;
  referenceNumber: string;
  serialNumber: string;
  valid: boolean;
  errors: string[];
};

export default function StockUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState<string>("");

  async function postTo(url: string) {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(url, { method: "POST", body: formData });
    return response.json();
  }

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await postTo("/api/inventory/upload");
      if (!result?.ok) throw new Error(result?.message || "Preview failed");
      setPreview(result.preview || []);
      setMessage(`Preview ready: ${result.validCount} valid, ${result.invalidCount} invalid`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed");
      setPreview([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await postTo("/api/inventory/import");
      if (!result?.ok) throw new Error(result?.message || "Import failed");
      setMessage(`Imported ${result.imported} of ${result.total} rows`);
      setPreview(result.preview || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="button secondary" onClick={handlePreview} disabled={!file || loading} type="button">
          {loading ? "Working..." : "Preview"}
        </button>
        <button className="button" onClick={handleImport} disabled={!file || loading} type="button">
          {loading ? "Working..." : "Import Valid Rows"}
        </button>
      </div>

      {message ? <p className="muted" style={{ marginTop: 12 }}>{message}</p> : null}

      {preview.length ? (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Reference</th>
                <th>Serial</th>
                <th>Valid</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.rowNumber}>
                  <td>{row.rowNumber}</td>
                  <td>{row.brand}</td>
                  <td>{row.model}</td>
                  <td>{row.referenceNumber || "—"}</td>
                  <td>{row.serialNumber}</td>
                  <td>{row.valid ? "Yes" : "No"}</td>
                  <td>{row.errors.length ? row.errors.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
