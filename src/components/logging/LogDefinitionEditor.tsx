// // src/components/logging/LogDefinitionEditor.tsx
// import React, { useEffect, useState, FormEvent } from "react";

// type Props = {
//   definitionId: string;       // e.g. "system.cpu.temp"
//   onSaved?: () => void;
// };

// const LogDefinitionEditor: React.FC<Props> = ({ definitionId, onSaved }) => {
//   const [rawJson, setRawJson] = useState<string>("{}");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   useEffect(() => {
//     let cancelled = false;

//     async function fetchDef() {
//       try {
//         setLoading(true);
//         setError(null);
//         const res = await fetch(`/api/log-definition?id=${encodeURIComponent(definitionId)}`);
//         if (!res.ok) throw new Error(`Load failed (${res.status})`);
//         const data = await res.json();
//         if (!cancelled) {
//           setRawJson(JSON.stringify(data, null, 2));
//         }
//       } catch (err: any) {
//         if (!cancelled) setError(err.message ?? "Failed to load definition");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     if (typeof window !== "undefined") {
//       fetchDef();
//     }

//     return () => {
//       cancelled = true;
//     };
//   }, [definitionId]);

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);

//     let parsed: unknown;
//     try {
//       parsed = JSON.parse(rawJson);
//     } catch (err: any) {
//       setError("Invalid JSON: " + (err.message ?? ""));
//       return;
//     }

//     try {
//       setSaving(true);
//       const res = await fetch(`/api/log-definition?id=${encodeURIComponent(definitionId)}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(parsed),
//       });
//       if (!res.ok) {
//         const body = await res.json().catch(() => ({}));
//         throw new Error(body.error || `Save failed (${res.status})`);
//       }
//       setSuccess("Saved successfully.");
//       onSaved?.();
//     } catch (err: any) {
//       setError(err.message ?? "Failed to save definition");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
//     >
//       {loading && <p>Loading current definition…</p>}
//       {error && (
//         <p style={{ color: "var(--danger)", fontSize: "var(--font-size-sm)" }}>
//           {error}
//         </p>
//       )}
//       {success && (
//         <p style={{ color: "var(--success)", fontSize: "var(--font-size-sm)" }}>
//           {success}
//         </p>
//       )}

//       <textarea
//         value={rawJson}
//         onChange={(e) => setRawJson(e.target.value)}
//         style={{
//           width: "100%",
//           minHeight: "300px",
//           fontFamily:
//             'SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
//           fontSize: "13px",
//           lineHeight: 1.5,
//           borderRadius: "var(--radius-md)",
//           border: "1px solid var(--border)",
//           padding: "var(--space-sm)",
//           background: "var(--bg)",
//           color: "var(--text)",
//         }}
//       />

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "flex-end",
//           gap: "var(--space-sm)",
//           marginTop: "var(--space-xs)",
//         }}
//       >
//         <button
//           type="submit"
//           disabled={saving}
//           style={{
//             border: "none",
//             borderRadius: "var(--radius-round)",
//             padding: "0.4rem 0.9rem",
//             fontSize: "var(--font-size-sm)",
//             fontWeight: 500,
//             background: "var(--primary)",
//             color: "#fff",
//             cursor: "pointer",
//             opacity: saving ? 0.7 : 1,
//           }}
//         >
//           {saving ? "Saving…" : "Save"}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default LogDefinitionEditor;
