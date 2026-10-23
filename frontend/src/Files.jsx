import { useEffect, useState } from "react";
import "./Files.css";

const API_URL = "http://localhost:5000";

function Files({ projects, token }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewingFileId, setPreviewingFileId] = useState("");

  // Select the first available project.
  useEffect(() => {
    if (!projects.length) {
      setSelectedProject("");
      setFiles([]);
      return;
    }

    setSelectedProject((current) =>
      projects.some((project) => String(project.id) === String(current))
        ? current
        : String(projects[0].id)
    );
  }, [projects]);

  // Load files whenever the selected project changes.
  useEffect(() => {
    if (!selectedProject || !token) {
      setFiles([]);
      return undefined;
    }

    const controller = new AbortController();

    async function loadFiles() {
      setLoading(true);
      setError("");
      setMessage("");
      setFiles([]);

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${selectedProject}/files`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load files");
        }

        setFiles(Array.isArray(data.files) ? data.files : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load files");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFiles();
    return () => controller.abort();
  }, [selectedProject, token]);

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedProject) {
      setError("Please select a project first.");
      return;
    }
    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/files`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "File upload failed");
      }

      setMessage("File uploaded successfully!");
      setSelectedFile(null);
      event.target.reset();

      const listResponse = await fetch(
        `${API_URL}/api/projects/${selectedProject}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const listData = await listResponse.json();

      if (!listResponse.ok) {
        throw new Error(
          listData.message || "Upload worked, but refreshing the list failed"
        );
      }

      setFiles(Array.isArray(listData.files) ? listData.files : []);
    } catch (err) {
      setError(err.message || "Could not upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handlePreview(fileId) {
    setError("");
    setMessage("");

    if (!selectedProject || !token) {
      setError("Please select a project and sign in again.");
      return;
    }

    // Open the tab immediately during the click event so the browser
    // is less likely to block it while the authenticated API request runs.
    const previewTab = window.open("about:blank", "_blank");
    if (!previewTab) {
      setError("Your browser blocked the preview tab. Allow pop-ups and try again.");
      return;
    }

    previewTab.opener = null;
    previewTab.document.title = "Opening file preview…";
    previewTab.document.body.innerHTML = "<p style='font-family: sans-serif; padding: 1rem'>Opening file preview…</p>";
    setPreviewingFileId(fileId);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/files/${fileId}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not generate file preview");
      }
      if (typeof data.previewUrl !== "string" || !data.previewUrl.trim()) {
        throw new Error("The server did not return a preview URL.");
      }

      previewTab.location.href = data.previewUrl;
    } catch (err) {
      previewTab.close();
      setError(err.message || "Could not preview file");
    } finally {
      setPreviewingFileId("");
    }
  }

  async function handleDeleteFile(fileId) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this file?"
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/files/${fileId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete file");
      }

      setFiles((current) => current.filter((file) => file._id !== fileId));
      setMessage("File deleted successfully!");
    } catch (err) {
      setError(err.message || "Could not delete file");
    }
  }

  function formatSize(bytes) {
    if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
      return "Unknown size";
    }
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <section className="files-page">
      <div className="files-heading">
        <div>
          <span className="files-eyebrow">PROJECT WORKSPACE</span>
          <h2>Project Files</h2>
          <p>Upload and organize files for your team.</p>
        </div>
        <span className="files-count">
          {files.length} {files.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="files-panel">
        <label htmlFor="files-project">Select project</label>
        <select
          id="files-project"
          value={selectedProject}
          onChange={(event) => {
            setSelectedProject(event.target.value);
            setSelectedFile(null);
          }}
          disabled={!projects.length || uploading}
        >
          {projects.length === 0 && <option value="">No projects available</option>}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <form className="file-upload-form" onSubmit={handleUpload}>
          <div className="file-upload-symbol">↥</div>
          <h3>Upload a file</h3>
          <p>Choose a document, image or code file up to 5 MB.</p>
          <label className="file-picker-label" htmlFor="project-file">
            Choose file
          </label>
          <input
            id="project-file"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.js,.jsx,.ts,.tsx,.json,.html,.css,.py,.java,.c,.cpp,.sql,.xml,.yml,.yaml,.csv"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={uploading || !selectedProject}
          />

          {selectedFile && (
            <div className="selected-file">
              <span>▤</span>
              <div>
                <strong>{selectedFile.name}</strong>
                <small>{formatSize(selectedFile.size)}</small>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="files-upload-button"
            disabled={uploading || !selectedFile || !selectedProject}
          >
            {uploading ? "Uploading…" : "Upload to project ↑"}
          </button>
        </form>
      </div>

      {error && <div className="files-feedback files-error" role="alert">{error}</div>}
      {message && <div className="files-feedback files-success" role="status">{message}</div>}

      <div className="files-list-heading">
        <h3>Uploaded files</h3>
        <span>Files belonging to the selected project</span>
      </div>

      {loading ? (
        <div className="files-empty">Loading files…</div>
      ) : files.length === 0 ? (
        <div className="files-empty">
          No uploaded files yet. Choose a file above to get started.
        </div>
      ) : (
        <div className="files-list">
          {files.map((file) => (
            <article className="file-row" key={file._id}>
              <div className="file-icon">▤</div>
              <div className="file-details">
                <strong>{file.originalName}</strong>
                <span>{file.mimeType || "Unknown type"} · {formatSize(file.size)}</span>
                <small>Uploaded by {file.uploadedBy?.name || "Project member"}</small>
              </div>

              <div className="file-actions">
                <span className="file-status">Uploaded</span>
                <button
                  type="button"
                  className="file-preview-button"
                  onClick={() => handlePreview(file._id)}
                  disabled={Boolean(previewingFileId)}
                >
                  {previewingFileId === file._id ? "Opening…" : "Preview ↗"}
                </button>
                <button
                  type="button"
                  className="file-delete-button"
                  onClick={() => handleDeleteFile(file._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Files;