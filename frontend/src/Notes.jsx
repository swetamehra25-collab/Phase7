import { useEffect, useState } from "react";
import "./Notes.css";

const API_URL = "https://phase7.onrender.com";

function Notes({ projects, token }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingNoteId, setUpdatingNoteId] = useState("");
  const [editingNoteId, setEditingNoteId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  useEffect(() => {
    if (!projects.length) {
      setSelectedProject("");
      setNotes([]);
      setEditingNoteId("");
      return;
    }

    setSelectedProject((current) =>
      projects.some((project) => String(project.id) === String(current))
        ? String(current)
        : String(projects[0].id)
    );
  }, [projects]);

  useEffect(() => {
    if (!selectedProject || !token) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadNotes() {
      setLoading(true);
      setError("");
      setMessage("");
      setNotes([]);
      setEditingNoteId("");
      setAiResults({});

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${selectedProject}/notes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load notes");
        }

        setNotes(data.notes || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load notes");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => controller.abort();
  }, [selectedProject, token]);

  async function handleCreateNote(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedProject) {
      setError("Please select a project first.");
      return;
    }

    if (!title.trim()) {
      setError("Note title is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create note");
      }

      setNotes((current) => [data.note, ...current]);
      setTitle("");
      setContent("");
      setMessage("Note saved successfully!");
    } catch (err) {
      setError(err.message || "Could not create note");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(note) {
    setEditingNoteId(note._id);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setError("");
    setMessage("");
    setAiResults((current) => {
      const updated = { ...current };
      delete updated[note._id];
      return updated;
    });
  }

  function cancelEditing() {
    setEditingNoteId("");
    setEditTitle("");
    setEditContent("");
  }

  async function handleUpdateNote(event, noteId) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!editTitle.trim()) {
      setError("Note title is required.");
      return;
    }

    setUpdatingNoteId(noteId);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/notes/${noteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update note");
      }

      setNotes((current) =>
        current.map((note) =>
          note._id === noteId ? data.note : note
        )
      );
      cancelEditing();
      setMessage("Note updated successfully!");
    } catch (err) {
      setError(err.message || "Could not update note");
    } finally {
      setUpdatingNoteId("");
    }
  }

  async function handleDeleteNote(noteId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete note");
      }

      setNotes((current) => current.filter((note) => note._id !== noteId));
      setAiResults((current) => {
        const updated = { ...current };
        delete updated[noteId];
        return updated;
      });
      if (editingNoteId === noteId) cancelEditing();
      setMessage("Note deleted successfully!");
    } catch (err) {
      setError(err.message || "Could not delete note");
    }
  }

  async function handleAIAction(note, action) {
    setError("");
    setMessage("");

    setAiLoading((current) => ({
      ...current,
      [note._id]: action,
    }));

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/notes/${note._id}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI request failed");
      }

      const result = action === "explain" ? data.explanation : data.improvedContent;

      setAiResults((current) => ({
        ...current,
        [note._id]: {
          action,
          content: result,
          originalContent: data.originalContent || note.content,
        },
      }));
    } catch (err) {
      setError(err.message || "AI request failed");
    } finally {
      setAiLoading((current) => ({
        ...current,
        [note._id]: null,
      }));
    }
  }

  async function handleSaveImprovement(note, aiResult) {
    setError("");
    setMessage("");
    setUpdatingNoteId(note._id);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/notes/${note._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: aiResult.content }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save improvement");
      }

      setNotes((current) =>
        current.map((item) => (item._id === note._id ? data.note : item))
      );
      setAiResults((current) => {
        const updated = { ...current };
        delete updated[note._id];
        return updated;
      });
      setMessage("Improved note saved successfully!");
    } catch (err) {
      setError(err.message || "Could not save improvement");
    } finally {
      setUpdatingNoteId("");
    }
  }

  return (
    <section className="notes-page">
      <div className="notes-heading">
        <div>
          <span className="notes-eyebrow">KNOWLEDGE WORKSPACE</span>
          <h2>Project Notes</h2>
          <p>Create documentation and use Gemini AI to work with your notes.</p>
        </div>

        <span className="notes-count">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </div>

      <div className="notes-panel">
        <label htmlFor="notes-project">Select project</label>

        <select
          id="notes-project"
          value={selectedProject}
          onChange={(event) => {
            setSelectedProject(event.target.value);
            setAiResults({});
            cancelEditing();
          }}
          disabled={!projects.length}
        >
          {projects.length === 0 && <option value="">No projects available</option>}

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <form className="note-create-form" onSubmit={handleCreateNote}>
          <h3>Create a note</h3>

          <label htmlFor="note-title">Note title</label>
          <input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Project Overview"
            maxLength={150}
            required
          />

          <label htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={"Write your notes here...\n\nMarkdown is supported."}
            rows={5}
          />

          <button
            type="submit"
            className="notes-primary-button"
            disabled={saving || !selectedProject}
          >
            {saving ? "Saving note..." : "＋ Save note"}
          </button>
        </form>
      </div>

      {error && (
        <div className="notes-feedback notes-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="notes-feedback notes-success" role="status">
          {message}
        </div>
      )}

      <div className="notes-list-heading">
        <h3>Saved notes</h3>
        <span>Stored in your project</span>
      </div>

      {loading ? (
        <div className="notes-empty">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="notes-empty">
          No notes found for this project. Create your first note above.
        </div>
      ) : (
        <div className="notes-list">
          {notes.map((note) => {
            const aiResult = aiResults[note._id];
            const isAiBusy = Boolean(aiLoading[note._id]);
            const isEditing = editingNoteId === note._id;
            const isUpdating = updatingNoteId === note._id;

            return (
              <article className="note-card" key={note._id}>
                <div className="note-card-header">
                  <div>
                    <h3>{note.title}</h3>
                    <span>{note.author?.name || "Project member"}</span>
                  </div>

                  <button
                    type="button"
                    className="notes-delete-button"
                    onClick={() => handleDeleteNote(note._id)}
                    disabled={isUpdating}
                  >
                    Delete
                  </button>
                </div>

                {isEditing ? (
                  <form
                    className="note-edit-form"
                    onSubmit={(event) => handleUpdateNote(event, note._id)}
                  >
                    <label htmlFor={`edit-title-${note._id}`}>Note title</label>
                    <input
                      id={`edit-title-${note._id}`}
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      maxLength={150}
                      required
                    />

                    <label htmlFor={`edit-content-${note._id}`}>Note content</label>
                    <textarea
                      id={`edit-content-${note._id}`}
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      rows={6}
                    />

                    <div className="note-ai-actions">
                      <button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Saving changes..." : "Save changes"}
                      </button>
                      <button type="button" onClick={cancelEditing} disabled={isUpdating}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <pre className="note-content">{note.content || "Empty note"}</pre>

                    <div className="note-ai-actions">
                      <button type="button" onClick={() => startEditing(note)} disabled={isAiBusy || isUpdating}>
                        Edit note
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIAction(note, "explain")}
                        disabled={isAiBusy || isUpdating}
                      >
                        {aiLoading[note._id] === "explain" ? "Explaining..." : "✳ Explain with AI"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIAction(note, "improve")}
                        disabled={isAiBusy || isUpdating}
                      >
                        {aiLoading[note._id] === "improve" ? "Improving..." : "Improve with AI"}
                      </button>
                    </div>
                  </>
                )}

                {aiResult && !isEditing && (
                  <div className="note-ai-result">
                    <div className="note-ai-result-header">
                      <strong>
                        {aiResult.action === "explain" ? "AI explanation" : "Suggested improved note"}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          setAiResults((current) => {
                            const updated = { ...current };
                            delete updated[note._id];
                            return updated;
                          })
                        }
                      >
                        Close
                      </button>
                    </div>

                    <pre className="note-content">{aiResult.content}</pre>

                    {aiResult.action === "improve" && (
                      <button
                        type="button"
                        className="notes-primary-button"
                        disabled={isUpdating}
                        onClick={() => handleSaveImprovement(note, aiResult)}
                      >
                        {isUpdating ? "Saving..." : "Save improved content"}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Notes;