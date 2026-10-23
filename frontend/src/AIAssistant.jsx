
import { useEffect, useState } from "react";
import "./AIAssistant.css";

const API_URL = "https://phase7.onrender.com";

function AIAssistant({ projects, token }) {
  const [mode, setMode] = useState("ask");
  const [selectedProject, setSelectedProject] = useState("");
  const [question, setQuestion] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [techStack, setTechStack] = useState("");
  const [codeOverview, setCodeOverview] = useState("");

  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projects.length) {
      setSelectedProject("");
      return;
    }

    setSelectedProject((current) =>
      projects.some(
        (project) => String(project.id) === String(current)
      )
        ? String(current)
        : String(projects[0].id)
    );
  }, [projects]);

  const toolTitles = {
    ask: "Ask about your project",
    explain: "Explain text or code",
    docs: "Generate code documentation",
    readme: "Generate a README",
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult("");

    let endpoint = "";
    let payload = {};

    if (mode === "ask") {
      if (!selectedProject) {
        setError("Please select a project.");
        return;
      }

      if (!question.trim()) {
        setError("Please enter your question.");
        return;
      }

      endpoint = "/api/ai/ask";
      payload = {
        projectId: selectedProject,
        question: question.trim(),
      };
    }

    if (mode === "explain") {
      if (!sourceText.trim()) {
        setError("Please enter text or code to explain.");
        return;
      }

      endpoint = "/api/gemini/explain";
      payload = { text: sourceText };
    }

    if (mode === "docs") {
      if (!sourceText.trim()) {
        setError("Please enter code to document.");
        return;
      }

      endpoint = "/api/gemini/docs";
      payload = {
        code: sourceText,
        language: language.trim() || "Not specified",
      };
    }

    if (mode === "readme") {
      if (!projectName.trim() || !description.trim()) {
        setError("Project name and description are required.");
        return;
      }

      const toList = (value) =>
        value
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);

      endpoint = "/api/gemini/readme";
      payload = {
        projectName: projectName.trim(),
        description: description.trim(),
        features: toList(features),
        techStack: toList(techStack),
        codeOverview: codeOverview.trim(),
      };
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI request failed.");
      }

      const output =
        mode === "ask"
          ? data.answer
          : mode === "explain"
            ? data.explanation
            : mode === "docs"
              ? data.documentation
              : data.readme;

      if (!output) {
        throw new Error("The AI returned an empty response.");
      }

      setResult(output);
    } catch (err) {
      setError(
        err.message || "Could not connect to the AI service."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-page">
      <header className="ai-page-heading">
        <div>
          <span className="ai-eyebrow">
            <span className="ai-live-dot"></span>
            YOUR AI-POWERED WORKSPACE
          </span>

          <h2>AI Assistant</h2>

          <p>
            Ask questions, explain code, generate documentation
            and create README files.
          </p>
        </div>

        <div className="ai-status">
          <span className="ai-live-dot"></span>
          Gemini AI
        </div>
      </header>

      <div className="ai-project-selector">
        <label htmlFor="ai-mode">Choose an AI tool</label>

        <select
          id="ai-mode"
          value={mode}
          onChange={(event) => {
            setMode(event.target.value);
            setError("");
            setResult("");
          }}
          disabled={loading}
        >
          <option value="ask">Ask about project</option>
          <option value="explain">Explain text or code</option>
          <option value="docs">Generate documentation</option>
          <option value="readme">Generate README.md</option>
        </select>

        <p>{toolTitles[mode]}</p>
      </div>

      <form className="ai-tool-form" onSubmit={handleSubmit}>
        {mode === "ask" && (
          <>
            <label htmlFor="ai-project">
              Select project
            </label>

            <select
              id="ai-project"
              value={selectedProject}
              onChange={(event) =>
                setSelectedProject(event.target.value)
              }
              disabled={loading || !projects.length}
            >
              {projects.length === 0 && (
                <option value="">No projects available</option>
              )}

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <label htmlFor="ai-question">
              Your question
            </label>

            <textarea
              id="ai-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask something about your project..."
              rows={4}
              maxLength={4000}
              disabled={loading}
            />
          </>
        )}

        {mode === "explain" && (
          <>
            <label htmlFor="ai-source">
              Text or code to explain
            </label>

            <textarea
              id="ai-source"
              value={sourceText}
              onChange={(event) =>
                setSourceText(event.target.value)
              }
              placeholder="Paste your notes, JavaScript, Python or other code..."
              rows={10}
              maxLength={15000}
              disabled={loading}
            />
          </>
        )}

        {mode === "docs" && (
          <>
            <label htmlFor="ai-language">
              Programming language
            </label>

            <input
              id="ai-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="JavaScript, Python, Java..."
              disabled={loading}
            />

            <label htmlFor="ai-source">
              Code to document
            </label>

            <textarea
              id="ai-source"
              value={sourceText}
              onChange={(event) =>
                setSourceText(event.target.value)
              }
              placeholder="Paste your code here..."
              rows={10}
              maxLength={15000}
              disabled={loading}
            />
          </>
        )}

        {mode === "readme" && (
          <>
            <label htmlFor="readme-name">
              Project name
            </label>

            <input
              id="readme-name"
              value={projectName}
              onChange={(event) =>
                setProjectName(event.target.value)
              }
              placeholder="e.g. CollabSphere"
              maxLength={150}
              disabled={loading}
              required
            />

            <label htmlFor="readme-description">
              Project description
            </label>

            <textarea
              id="readme-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="What does your project do?"
              rows={3}
              maxLength={3000}
              disabled={loading}
              required
            />

            <label htmlFor="readme-features">
              Key features (one per line)
            </label>

            <textarea
              id="readme-features"
              value={features}
              onChange={(event) =>
                setFeatures(event.target.value)
              }
              placeholder={"User authentication\nProject management\nAI assistance"}
              rows={3}
              disabled={loading}
            />

            <label htmlFor="readme-stack">
              Tech stack (one per line)
            </label>

            <textarea
              id="readme-stack"
              value={techStack}
              onChange={(event) =>
                setTechStack(event.target.value)
              }
              placeholder={"React\nNode.js\nExpress\nMongoDB"}
              rows={3}
              disabled={loading}
            />

            <label htmlFor="readme-overview">
              Additional code overview (optional)
            </label>

            <textarea
              id="readme-overview"
              value={codeOverview}
              onChange={(event) =>
                setCodeOverview(event.target.value)
              }
              placeholder="Describe any important technical details..."
              rows={3}
              maxLength={10000}
              disabled={loading}
            />
          </>
        )}

        {error && (
          <div className="ai-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="ai-tool-submit"
          disabled={loading}
        >
          {loading ? "Gemini is working..." : `Generate with Gemini →`}
        </button>
      </form>

      {result && (
        <section className="ai-result-panel">
          <div className="ai-result-heading">
            <div>
              <span className="ai-eyebrow">GENERATED RESULT</span>
              <h3>{toolTitles[mode]}</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  .writeText(result)
                  .catch(() =>
                    setError("Could not copy. Please select the result manually.")
                  );
              }}
            >
              Copy result
            </button>
          </div>

          <pre className="ai-result-content">{result}</pre>

          {mode === "readme" && (
            <button
              type="button"
              className="ai-tool-submit"
              onClick={() => {
                const blob = new Blob([result], {
                  type: "text/markdown;charset=utf-8",
                });

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "README.md";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download README.md ↓
            </button>
          )}
        </section>
      )}

      <p className="ai-disclaimer">
        AI output may contain mistakes. Review generated code
        documentation and README instructions before using them.
      </p>
    </section>
  );
}

export default AIAssistant;
