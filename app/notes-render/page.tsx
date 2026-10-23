import { Note, NoteBack } from "@/components/Note";

// Build helper: renders each note face on its own so scripts/render-notes.py can
// snapshot them into /public/notes/*.webp. Not linked anywhere in the app.
export const metadata = { robots: { index: false } };

export default function NotesRender() {
  const vals = [50, 100, 200, 500, 1000];
  return (
    <main style={{ padding: 20, display: "grid", gap: 20, background: "transparent" }}>
      {vals.map((v) => (
        <div key={v} style={{ display: "flex", gap: 20 }}>
          <div id={`front-${v}`} style={{ width: 420, height: 200 }}><Note amount={v} style={{ width: 420, height: 200, display: "block" }} /></div>
          <div id={`back-${v}`} style={{ width: 420, height: 200 }}><NoteBack amount={v} className="nb" /></div>
        </div>
      ))}
      <style>{`.nb{width:420px;height:200px;display:block} body{background:transparent!important}`}</style>
    </main>
  );
}
