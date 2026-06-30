"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import AdminNav from "@/components/AdminNav";
import {
  PERSON_FIELDS,
  autoMatchField,
  parseValue,
  type FieldType,
} from "@/lib/people-fields";
import type { PersonInput } from "@/lib/types";

type Mapping = Record<string, string>; // csvHeader -> person field key ("" = ignore)

interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  duplicatesInFile: number;
  errors: string[];
}

const fieldType = (key: string): FieldType =>
  PERSON_FIELDS.find((f) => f.key === key)?.type ?? "text";

export default function ImportPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data);
        const auto: Mapping = {};
        for (const h of hdrs) auto[h] = autoMatchField(h) ?? "";
        setMapping(auto);
      },
      error: (err) => setError(err.message),
    });
  }

  function buildPayload(): PersonInput[] {
    return rows.map((row) => {
      const person: Record<string, unknown> = {};
      for (const header of headers) {
        const key = mapping[header];
        if (!key) continue;
        const parsed = parseValue(fieldType(key), row[header] ?? "");
        if (parsed === null || parsed === "") continue;
        person[key] = parsed;
      }
      return person as PersonInput;
    });
  }

  async function handleImport() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/people/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: buildPayload(), source: fileName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed.");
      setResult(json as ImportResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Import people</h1>
          <Link href="/people" className="text-sm text-brand-dark hover:underline">
            ← Back to people
          </Link>
        </div>
        <p className="mt-1 text-slate-600">
          Upload a CSV export of your contacts. We&apos;ll match columns to fields,
          let you adjust, then import — de-duplicating on email and phone.
        </p>

        <div className="mt-6">
          <label className="inline-block cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {fileName || "Choose CSV file…"}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Import complete</p>
            <ul className="mt-1 list-inside list-disc">
              <li>{result.inserted} new people added</li>
              <li>{result.updated} existing people updated</li>
              {result.duplicatesInFile > 0 && (
                <li>{result.duplicatesInFile} duplicate rows merged within the file</li>
              )}
              {result.skipped > 0 && <li>{result.skipped} rows skipped (no data)</li>}
            </ul>
            {result.errors.length > 0 && (
              <p className="mt-2 text-rose-600">
                {result.errors.length} error(s): {result.errors[0]}
              </p>
            )}
            <Link
              href="/people"
              className="mt-3 inline-block font-medium text-emerald-700 hover:underline"
            >
              View people →
            </Link>
          </div>
        )}

        {headers.length > 0 && !result && (
          <>
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Column mapping
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mappedCount} of {headers.length} columns mapped. Set unwanted
                columns to &quot;Ignore&quot;.
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">CSV column</th>
                      <th className="px-4 py-2 font-medium">Sample value</th>
                      <th className="px-4 py-2 font-medium">Maps to field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {headers.map((h) => (
                      <tr key={h}>
                        <td className="px-4 py-2 font-medium text-slate-700">{h}</td>
                        <td className="px-4 py-2 text-slate-400">
                          {rows[0]?.[h] ?? ""}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={mapping[h] ?? ""}
                            onChange={(e) =>
                              setMapping({ ...mapping, [h]: e.target.value })
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            <option value="">— Ignore —</option>
                            {PERSON_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={busy || mappedCount === 0}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Importing…" : `Import ${rows.length} rows`}
              </button>
              <span className="text-sm text-slate-400">
                {rows.length} rows in file
              </span>
            </div>
          </>
        )}
      </main>
    </>
  );
}
