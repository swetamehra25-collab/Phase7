import { useEffect, useState } from "react";
import "./App.css";
import TeamMembers from "./TeamMembers";
import Notes from "./Notes";
import Files from "./Files";
import AIAssistant from "./AIAssistant";
import Settings from "./Settings";
import "./PublicSharing.css";


const API_URL = "https://phase7.onrender.com";
const initialActivity = [
  {
    icon: "N",
    title: "Project workspace",
    detail: "Manage your projects and notes",
    time: "Workspace",
  },
  {
    icon: "AI",
    title: "Gemini AI",
    detail: "Explain and improve project notes",
    time: "AI tools",
  },
];

function formatProject(project, index = 0) {
  const themes = ["lime", "purple", "blue"];

  return {
    id: project._id,
    name: project.name,
    description: project.description || "No description added",
    createdAt: project.createdAt || project.createdAt || "",
    initials: project.name.slice(0, 2).toUpperCase(),
    theme: themes[index % themes.length],
    members: Array.isArray(project.members)
      ? project.members.length
      : 1,
    ownerId: project.owner?._id
      ? String(project.owner._id)
      : project.owner
        ? String(project.owner)
        : "",
    visibility: project.visibility || "private",
    status:
      project.visibility === "public" ? "Public" : "Private",
    progress: 0,
  };
}

function Dashboard({ user, token, onLogout, onUserUpdate }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Overview");

  // My Projects UI state
  const [projectFilter, setProjectFilter] = useState("all"); // all | public | private
  const [projectSort, setProjectSort] = useState("newest"); // newest | name
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    teamMembers: 0,
    notesCreated: 0,
    filesUploaded: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectFormError, setProjectFormError] = useState("");
  const [sharingProjectId, setSharingProjectId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

    // normalize current user id (some endpoints return `id`, others `_id`)
    const currentUserId = user?.id || user?._id || "";

  // Load actual projects from the backend
  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoadingProjects(true);
      setProjectsError("");

      try {
        const response = await fetch(`${API_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load projects");
        }

        if (!cancelled) {
          const actualProjects = Array.isArray(data.projects)
            ? data.projects.map((project, index) =>
                formatProject(project, index)
              )
            : [];

          setProjects(actualProjects);
        }
      } catch (error) {
        if (!cancelled) {
          setProjectsError(
            error.message || "Could not connect to the backend"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load real dashboard counts from the backend.
  // Refresh when changing sections so note/file changes are reflected on return.
  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoadingAnalytics(true);
      setAnalyticsError("");

      try {
        const response = await fetch(`${API_URL}/api/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load analytics");
        }

        if (!cancelled) {
          setAnalytics({
            totalProjects: data.analytics?.totalProjects ?? 0,
            teamMembers: data.analytics?.teamMembers ?? 0,
            notesCreated: data.analytics?.notesCreated ?? 0,
            filesUploaded: data.analytics?.filesUploaded ?? 0,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setAnalyticsError(
            error.message || "Could not load dashboard analytics"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAnalytics(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [token, activeNav]);

  // Create a real project in MongoDB
  async function handleCreateProject(event) {
    event.preventDefault();

    if (!projectName.trim()) {
      setProjectFormError("Project name is required.");
      return;
    }

    setCreatingProject(true);
    setProjectFormError("");

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName.trim(),
            description: projectDescription.trim(),
            visibility: user?.preferences?.defaultVisibility || "private",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create project");
      }

      const newProject = formatProject(data.project, 0);

      setProjects((current) => [
        newProject,
        ...current.filter((project) => project.id !== newProject.id),
      ]);

      setProjectName("");
      setProjectDescription("");
      setShowModal(false);
      setProjectFormError("");
      setActiveNav("My Projects");
    } catch (error) {
      setProjectFormError(
        error.message || "Could not connect to the backend"
      );
    } finally {
      setCreatingProject(false);
    }
  }

  // Make an owned project public and copy its shareable URL.
  async function handleShareProject(project) {
    if (String(project.ownerId) !== String(currentUserId)) {
      setShareMessage("Only the project owner can make this project public.");
      setShareUrl("");
      return;
    }

    if (project.visibility !== "public") {
      const confirmed = window.confirm(
        "Make this project public? Anyone with the link can view its description and all saved notes. Remove sensitive information before sharing."
      );
      if (!confirmed) return;
    }

    setSharingProjectId(String(project.id));
    setShareMessage("");
    setShareUrl("");

    try {
      if (project.visibility !== "public") {
        const response = await fetch(`${API_URL}/api/projects/${project.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ visibility: "public" }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not make project public");
        }

        setProjects((current) =>
          current.map((item) =>
            String(item.id) === String(project.id)
              ? { ...item, visibility: "public", status: "Public" }
              : item
          )
        );
      }

      const url = `${window.location.origin}/public/${project.id}`;
      setShareUrl(url);

      try {
        await navigator.clipboard.writeText(url);
        setShareMessage("Public link copied! Anyone with this link can view this project and its notes.");
      } catch {
        setShareMessage("Project is public. Copy the link shown below to share it.");
      }
    } catch (error) {
      setShareMessage(error.message || "Could not share project");
    } finally {
      setSharingProjectId("");
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Public link copied to clipboard.");
    } catch {
      setShareMessage("Select and copy the link below to share it.");
    }
  }

  const visibleProjects = projects.filter((project) =>
    `${project.name} ${project.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Derived list for the My Projects view (search + filter + sort)
  const myProjectsFiltered = (() => {
    let list = visibleProjects.slice();

    if (projectFilter !== "all") {
      list = list.filter(
        (p) => (p.visibility || p.status || "private") === projectFilter
      );
    }

    if (projectSort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (projectSort === "newest") {
      list.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    return list;
  })();

  const [overviewProjects, setOverviewProjects] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  const [myProjectDetails, setMyProjectDetails] = useState({});
  const [loadingMyProjectsDetails, setLoadingMyProjectsDetails] = useState(false);
  const [myProjectsError, setMyProjectsError] = useState("");

  // Load detailed overview data (members, notes, files) for every project
  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      if (activeNav !== "Overview") return;
      if (!projects.length || !token) {
        setOverviewProjects([]);
        return;
      }

      setLoadingOverview(true);
      setOverviewError("");

      try {
        const results = await Promise.all(
          projects.map(async (proj) => {
            const id = proj.id;

            const fetchOptions = {
              headers: { Authorization: `Bearer ${token}` },
            };

            const [membersRes, notesRes, filesRes] = await Promise.all([
              fetch(`${API_URL}/api/projects/${id}/members`, fetchOptions).then((r) => r.json()).catch(() => ({ members: [] })),
              fetch(`${API_URL}/api/projects/${id}/notes`, fetchOptions).then((r) => r.json()).catch(() => ({ notes: [] })),
              fetch(`${API_URL}/api/projects/${id}/files`, fetchOptions).then((r) => r.json()).catch(() => ({ files: [] })),
            ]);

            const members = Array.isArray(membersRes.members) ? membersRes.members : [];
            const notes = Array.isArray(notesRes.notes) ? notesRes.notes : [];
            const files = Array.isArray(filesRes.files) ? filesRes.files : [];

            // Build a small activity feed from notes and files
            const activities = [];

            notes.forEach((note) => {
              activities.push({
                type: "note",
                id: note._id,
                title: note.title || "(untitled)",
                date: note.updatedAt || note.createdAt || note._id, // fallback
              });
            });

            files.forEach((file) => {
              activities.push({
                type: "file",
                id: file._id,
                title: file.name || "file",
                date: file.updatedAt || file.createdAt || file._id,
              });
            });

            activities.sort((a, b) => {
              const ta = new Date(a.date).getTime() || 0;
              const tb = new Date(b.date).getTime() || 0;
              return tb - ta;
            });

            return {
              id,
              name: proj.name,
              description: proj.description,
              visibility: proj.visibility || proj.status || "private",
              members,
              notes,
              files,
              recentActivity: activities.slice(0, 5),
            };
          })
        );

        if (!cancelled) setOverviewProjects(results);
      } catch (err) {
        if (!cancelled) setOverviewError(err.message || "Could not load overview data");
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    }

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, [activeNav, projects, token]);

  // Load per-project details (counts, members) when viewing My Projects
  useEffect(() => {
    let cancelled = false;

    async function loadMyProjectDetails() {
      if (activeNav !== "My Projects") return;
      if (!projects.length || !token) {
        setMyProjectDetails({});
        return;
      }

      setLoadingMyProjectsDetails(true);
      setMyProjectsError("");

      try {
        const entries = await Promise.all(
          projects.map(async (proj) => {
            const id = proj.id;
            const fetchOptions = { headers: { Authorization: `Bearer ${token}` } };

            const [membersRes, notesRes, filesRes] = await Promise.all([
              fetch(`${API_URL}/api/projects/${id}/members`, fetchOptions).then((r) => r.json()).catch(() => ({ members: [] })),
              fetch(`${API_URL}/api/projects/${id}/notes`, fetchOptions).then((r) => r.json()).catch(() => ({ notes: [] })),
              fetch(`${API_URL}/api/projects/${id}/files`, fetchOptions).then((r) => r.json()).catch(() => ({ files: [] })),
            ]);

            const members = Array.isArray(membersRes.members) ? membersRes.members : [];
            const notes = Array.isArray(notesRes.notes) ? notesRes.notes : [];
            const files = Array.isArray(filesRes.files) ? filesRes.files : [];

            // recent activity for quick summary
            const activities = [];
            notes.slice(0, 3).forEach((n) => activities.push({ type: 'note', id: n._id, title: n.title || '(untitled)', date: n.updatedAt || n.createdAt }));
            files.slice(0, 3).forEach((f) => activities.push({ type: 'file', id: f._id, title: f.name || 'file', date: f.updatedAt || f.createdAt }));

            return [id, { members, notesCount: notes.length, filesCount: files.length, activities }];
          })
        );

        if (!cancelled) setMyProjectDetails(Object.fromEntries(entries));
      } catch (err) {
        if (!cancelled) setMyProjectsError(err.message || "Could not load project details");
      } finally {
        if (!cancelled) setLoadingMyProjectsDetails(false);
      }
    }

    loadMyProjectDetails();

    return () => {
      cancelled = true;
    };
  }, [activeNav, projects, token]);

  async function handleDeleteProject(projectId) {
    const confirmed = window.confirm("Permanently delete this project? This cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete project");

      setProjects((current) => current.filter((p) => String(p.id) !== String(projectId)));
      setOverviewProjects((current) => current.filter((p) => String(p.id) !== String(projectId)));
      setMyProjectDetails((current) => {
        const copy = { ...current };
        delete copy[projectId];
        return copy;
      });
    } catch (err) {
      alert(err.message || "Could not delete project");
    }
  }

  async function handleEditProject(projectId) {
    const project = projects.find((p) => String(p.id) === String(projectId));
    if (!project) return;

    const newName = window.prompt("Project name", project.name);
    if (newName === null) return; // cancelled
    const newDescription = window.prompt("Project description", project.description || "");

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), description: newDescription }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update project");

      const updated = formatProject(data.project);
      setProjects((current) => current.map((p) => (String(p.id) === String(projectId) ? updated : p)));
    } catch (err) {
      alert(err.message || "Could not update project");
    }
  }

  const navigation = [
    { label: "Overview", icon: "◫" },
    { label: "My Projects", icon: "▦" },
    { label: "Team Members", icon: "♧" },
    { label: "Notes", icon: "▤" },
    { label: "Files", icon: "↥" },
    { label: "AI Assistant", icon: "✳" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-mark">C</span>
          <span>
            collab<span className="brand-highlight">sphere</span>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">{initials}</span>
          <span className="workspace-info">
            <strong>{firstName}'s workspace</strong>
            <small>Personal workspace</small>
          </span>
          <span className="switcher-arrow">⌄</span>
          </div>

        <div className="nav-label">MENU</div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.label === "AI Assistant" && (
                <span className="new-tag">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className={`nav-item ${
              activeNav === "Settings" ? "active" : ""
            }`}
            onClick={() => setActiveNav("Settings")}
          >
            <span className="nav-icon">⚙</span>
            Settings
          </button>

          <button
            type="button"
            className="sidebar-logout-button"
            onClick={onLogout}
          >
            Log out
          </button>

          <div className="user-profile">
            <div className="user-avatar">{initials}</div>

            <div className="user-info">
              <strong>{user?.name || "User"}</strong>
              <small>{user?.email || "Signed in"}</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <span>⌕</span>
              <input
                aria-label="Search projects"
                placeholder="Search projects..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>/</kbd>
            </label>

            <div className="topbar-avatar">{initials}</div>
          </div>
        </header>

        <div className="page-content" id="overview">
          {activeNav === "Settings" ? (
            <Settings user={user} token={token} onUserUpdate={onUserUpdate} />
          ) : activeNav === "AI Assistant" ? (
            <AIAssistant
              projects={projects.map((project) => ({
                id: project.id,
                name: project.name,
              }))}
              token={token}
            />
          ) : activeNav === "Team Members" ? (
            <TeamMembers projects={projects} token={token} userId={currentUserId} />
          ) : activeNav === "Files" ? (
            <Files
              projects={projects.map((project) => ({
                id: project.id,
                name: project.name,
              }))}
              token={token}
            />
          ) : activeNav === "Notes" ? (
            <Notes
              projects={projects.map((project) => ({
                id: project.id,
                name: project.name,
              }))}
              token={token}
            />
          ) : (
            <>
          {activeNav === "Overview" && (
            <>
              <section className="welcome-section">
                <div>
                  <div className="eyebrow">
                    <span className="live-dot"></span>
                    YOUR WORKSPACE AT A GLANCE
                  </div>

                  <h1>
                    <span className="welcome-greeting">Good to see you,</span>
                    <span className="welcome-name">{firstName}</span>
                  </h1>

                  <p className="welcome-description">Great ideas happen when everyone works together.</p>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setProjectFormError("");
                    setShowModal(true);
                  }}
                >
                  <span>＋</span> New project
                </button>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total projects</span>
                    <span className="stat-icon lime-icon">▦</span>
                  </div>
                  <div className="stat-value">{loadingAnalytics ? "…" : analytics.totalProjects}</div>
                  <div className="stat-caption">Projects in your account</div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Team members</span>
                    <span className="stat-icon purple-icon">♧</span>
                  </div>
                  <div className="stat-value">{loadingAnalytics ? "…" : analytics.teamMembers}</div>
                  <div className="stat-caption">Unique members across your projects</div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Notes created</span>
                    <span className="stat-icon blue-icon">▤</span>
                  </div>
                  <div className="stat-value">{loadingAnalytics ? "…" : analytics.notesCreated}</div>
                  <div className="stat-caption">Saved project notes</div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Files uploaded</span>
                    <span className="stat-icon orange-icon">↥</span>
                  </div>
                  <div className="stat-value">{loadingAnalytics ? "…" : analytics.filesUploaded}</div>
                  <div className="stat-caption">Saved file records</div>
                </article>
              </section>

              {analyticsError && (
                <div className="empty-state" role="alert">Analytics could not load: {analyticsError}</div>
              )}

              {loadingOverview ? (
                <div className="empty-state">Loading overview…</div>
              ) : overviewError ? (
                <div className="empty-state" role="alert">Overview could not load: {overviewError}</div>
              ) : (
                <section className="overview-projects">
                  {overviewProjects.map((p) => (
                    <article className="panel project-overview" key={p.id}>
                      <div className="panel-header">
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.description}</p>
                        </div>
                        <div className="project-overview-meta">
                          <span className="private-label"><span>●</span> {p.visibility}</span>
                          <small>{p.members.length} {p.members.length === 1 ? "member" : "members"}</small>
                          <small>{p.notes.length} {p.notes.length === 1 ? "note" : "notes"}</small>
                          <small>{p.files.length} {p.files.length === 1 ? "file" : "files"}</small>
                        </div>
                      </div>

                      <div className="project-overview-body">
                        <div className="project-overview-activity">
                          <h4>Recent activity</h4>
                          {p.recentActivity.length === 0 ? (
                            <div className="empty-state">No recent activity</div>
                          ) : (
                            <ul className="activity-feed">
                              {p.recentActivity.map((act) => (
                                <li key={act.type + act.id} className="activity-row">
                                  <span className="activity-type">{act.type === "note" ? "▤" : "↥"}</span>
                                  <span className="activity-title">{act.title}</span>
                                  <small className="activity-date">{new Date(act.date).toLocaleString()}</small>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="project-overview-members">
                          <h4>Team</h4>
                          {p.members.length === 0 ? (
                            <div className="empty-state">No members</div>
                          ) : (
                            <ul className="members-inline">
                              {p.members.map((m) => (
                                <li key={m._id} className="member-inline-item">
                                  <strong>{m.name || m.email}</strong>
                                  <small>{m.email}</small>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}

          <div className="dashboard-grid">
            <section className="panel projects-panel">
              <div className="panel-header">
                <div>
                  <h2>{activeNav === "My Projects" ? "My projects" : "Recent projects"}</h2>
                  <p>Projects loaded from your workspace</p>
                </div>

                <button type="button" className="text-button" onClick={() => { setActiveNav("My Projects"); setSearch(""); }}>
                  View all <span>↗</span>
                </button>
              </div>

              {shareMessage && (
                <div className="share-feedback" role="status">
                  <p>{shareMessage}</p>
                  {shareUrl && (
                    <div className="share-link-row">
                      <input aria-label="Public project link" readOnly value={shareUrl} />
                      <button type="button" onClick={copyShareUrl}>Copy link</button>
                      <a href={shareUrl} target="_blank" rel="noreferrer">Open</a>
                    </div>
                  )}
                </div>
              )}

              {projectsError && (
                <div className="empty-state" role="alert">
                  <p>{projectsError}</p>
                  <button type="button" className="text-button" onClick={() => window.location.reload()}>Retry</button>
                </div>
              )}

              {loadingProjects ? (
                <div className="empty-state">Loading your projects…</div>
              ) : !projectsError && visibleProjects.length === 0 ? (
                <div className="empty-state">{search ? "No matching projects. Try another search." : "You don't have any projects yet. Create your first project!"}</div>
                  ) : activeNav === "My Projects" ? (
                <div className="my-projects-management">
                  <div className="projects-controls">
                    <div className="controls-left">
                      <label className="control">
                        <span>Filter</span>
                        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                          <option value="all">All</option>
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </label>

                      <label className="control">
                        <span>Sort</span>
                        <select value={projectSort} onChange={(e) => setProjectSort(e.target.value)}>
                          <option value="newest">Newest</option>
                          <option value="name">Name</option>
                        </select>
                      </label>

                      <div className="view-toggle">
                        <button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>Grid</button>
                        <button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
                      </div>
                    </div>

                    <div className="controls-right">
                      <button type="button" className="primary-button" onClick={() => { setProjectFormError(''); setShowModal(true); }}>
                        ＋ Create
                      </button>
                    </div>
                  </div>

                  {myProjectsFiltered.length === 0 ? (
                    <div className="empty-state">{search ? "No matching projects. Try another search or adjust filters." : "No projects to show. Create your first project!"}</div>
                  ) : (
                    <div className={`projects-grid ${viewMode === 'grid' ? 'grid' : 'list'}`}>
                      {myProjectsFiltered.map((p) => {
                        const details = myProjectDetails[p.id] || {};
                        return (
                          <article className={`project-card-detailed ${viewMode === 'grid' ? 'grid' : 'list'}`} key={p.id}>
                            <div className="card-header">
                              <div className={`project-logo ${p.theme}`}>{p.initials}</div>
                              <div className="card-meta">
                                <h3>{p.name}</h3>
                                <div className="card-meta-row"><span className="private-label"><span>●</span> {p.visibility}</span><small>Created: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</small></div>
                              </div>
                            </div>

                            <div className="card-body">
                              <p>{p.description}</p>
                              <div className="card-stats">
                                <span>♧ {(details.members || []).length} members</span>
                                <span>{details.notesCount ?? 0} notes</span>
                                <span>{details.filesCount ?? 0} files</span>
                              </div>
                            </div>

                            <div className="card-actions">
                              <button className="btn" onClick={() => handleEditProject(p.id)}>Edit</button>
                              <button className="btn danger" onClick={() => handleDeleteProject(p.id)}>Delete</button>
                              <button className="btn" disabled={sharingProjectId === String(p.id)} onClick={() => handleShareProject(p)}>
                                {sharingProjectId === String(p.id) ? 'Preparing link...' : p.visibility === 'public' ? 'Copy public link ↗' : 'Make public & share ↗'}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="project-list">
                  {visibleProjects.map((project) => (
                    <article className="project-card" key={project.id}>
                      <div className={`project-logo ${project.theme}`}>{project.initials}</div>
                      <div className="project-details">
                        <div className="project-title-row">
                          <h3>{project.name}</h3>
                          <span className="private-label"><span>●</span> {project.status}</span>
                        </div>

                        <p>{project.description}</p>

                        <div className="project-meta">
                          <span>♧ {project.members} members</span>
                          <span>{project.visibility}</span>
                        </div>

                        <div className="progress-track">
                          <div className="progress-fill" style={{width: `${project.progress}%`}}></div>
                        </div>

                        {String(project.ownerId) === String(currentUserId) && (
                          <div className="project-actions">
                            <button type="button" className="share-project-button" disabled={sharingProjectId === String(project.id)} onClick={() => handleShareProject(project)}>
                              {sharingProjectId === String(project.id) ? "Preparing link..." : project.visibility === "public" ? "Copy public link ↗" : "Make public & share ↗"}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )
            }
            </section>

            <section className="panel activity-panel">
              <div className="panel-header"><div><h2>Workspace tools</h2><p>Features available in CollabSphere</p></div></div>
              <div className="activity-list">{initialActivity.map((activity, index) => (<article className="activity-item" key={activity.title}><div className={`activity-avatar activity-${index + 1}`}>{activity.icon}</div><div className="activity-content"><strong>{activity.title}</strong><span>{activity.detail}</span><small>{activity.time}</small></div></article>))}</div>
              <div className="activity-footer"><span className="live-dot"></span>Backend connection enabled</div>
            </section>
          </div>

          <section className="bottom-banner"><div className="banner-symbol">✳</div><div className="banner-text"><span>MEET YOUR NEW TEAMMATE</span><h2>A little help from AI goes a long way.</h2><p>Explain technical notes and improve your project documentation.</p></div><button type="button" className="banner-button" onClick={() => setActiveNav("AI Assistant")}>Explore AI <span>↗</span></button><div className="banner-decoration">✳</div></section>

          <footer className="page-footer"><span>© 2026 CollabSphere</span><span>Made for teams that build together <b>✳</b></span></footer>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !creatingProject) {
              setShowModal(false);
            }
          }}
        >
          <form className="project-modal" onSubmit={handleCreateProject}>
            <button type="button" className="modal-close" aria-label="Close dialog" disabled={creatingProject} onClick={() => setShowModal(false)}>×</button>

            <div className="modal-icon">＋</div>
            <h2>Create a project</h2>
            <p>Start a new space for your team's ideas and work.</p>

            {projectFormError && (
              <div className="auth-message error-message" role="alert">{projectFormError}</div>
            )}

            <label htmlFor="projectName">Project name</label>
            <input id="projectName" autoFocus maxLength={100} placeholder="e.g. My new project" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />

            <label htmlFor="projectDescription">Description</label>
            <textarea id="projectDescription" maxLength={1000} placeholder="What are you building?" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />

            <button type="submit" className="primary-button modal-submit" disabled={creatingProject}>{creatingProject ? "Creating project..." : "Create project →"}</button>

            <small className="modal-note">Projects are saved to your MongoDB database.</small>
          </form>
        </div>
      )}
    </div>
  );
}

export default Dashboard;