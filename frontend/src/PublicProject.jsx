import { useEffect, useState } from "react";
import "./PublicProject.css";

const API_URL = "http://localhost:5000";

function PublicProject({ projectId }) {
  const [project, setProject] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProject() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_URL}/api/public/projects/${encodeURIComponent(projectId)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load this public project.");
        }
        setProject(data.project);
        setNotes(Array.isArray(data.notes) ? data.notes : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not connect to the server.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (!projectId) {
      setError("Project ID is missing from this link.");
      setLoading(false);
    } else {
      loadProject();
    }

    return () => controller.abort();
  }, [projectId]);

  return (
    <main className="public-page">
      <header className="public-header">
        <a className="public-brand" href="/">
          <span className="public-brand-mark">C</span>
          <span>CollabSphere</span>
        </a>
        <span className="public-badge"><span /> Public project</span>
      </header>

      {loading ? (
        <section className="public-state"><p>Loading public project...</p></section>
      ) : error || !project ? (
        <section className="public-state public-error-state">
          <div className="public-symbol">!</div>
          <h1>Project unavailable</h1>
          <p>{error || "This project does not exist or is not public."}</p>
          <a className="public-home-link" href="/">Go to CollabSphere</a>
        </section>
      ) : (
        <>
          <section className="public-hero">
            <span className="public-eyebrow">SHARED WORKSPACE</span>
            <h1>{project.name}</h1>
            <p>{project.description || "No project description provided."}</p>
            <div className="public-meta">
              <span>Created by <strong>{project.owner?.name || "Project owner"}</strong></span>
              <span className="public-note-count">{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
            </div>
          </section>

          <section className="public-notes-section">
            <div className="public-section-heading">
              <span className="public-eyebrow">PROJECT KNOWLEDGE</span>
              <h2>Shared notes</h2>
              <p>These notes are visible because the project owner made this project public.</p>
            </div>

            {notes.length === 0 ? (
              <div className="public-empty">
                <div className="public-symbol">▤</div>
                <h3>No notes available</h3>
                <p>This project does not currently have any notes.</p>
              </div>
            ) : (
              <div className="public-notes-list">
                {notes.map((note) => (
                  <article className="public-note-card" key={note._id}>
                    <div className="public-note-icon">▤</div>
                    <div className="public-note-body">
                      <h3>{note.title}</h3>
                      <pre>{note.content || "Empty note"}</pre>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer className="public-footer">
        <a className="public-brand" href="/">
          <span className="public-brand-mark">C</span>
          <span>CollabSphere</span>
        </a>
        <span>Shared for collaboration.</span>
      </footer>
    </main>
  );
}

export default PublicProject;