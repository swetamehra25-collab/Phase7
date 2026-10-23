import { useEffect, useState } from "react";
import "./TeamMembers.css";

const API_URL = "https://phase7.onrender.com";

function TeamMembers({ projects, token, userId }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingMember, setRemovingMember] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedProjectData = projects.find(
    (project) => String(project.id) === String(selectedProject)
  );

  const isProjectOwner =
    Boolean(userId) &&
    Boolean(selectedProjectData?.ownerId) &&
    String(selectedProjectData.ownerId) === String(userId);

  // Select the first available project
  useEffect(() => {
    if (!projects.length) {
      setSelectedProject("");
      setMembers([]);
      setLoading(false);
      return;
    }

    setSelectedProject((current) =>
      projects.some(
        (project) => String(project.id) === String(current)
      )
        ? current
        : String(projects[0].id)
    );
  }, [projects]);

  // Load project members
  useEffect(() => {
    if (!selectedProject || !token) {
      setMembers([]);
      return;
    }

    const controller = new AbortController();

    async function loadMembers() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${selectedProject}/members`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load team members"
          );
        }

        setMembers(data.members || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load team members");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => controller.abort();
  }, [selectedProject, token]);

  // Add a registered user to the project
  async function handleAddMember(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!selectedProject) {
      setError("Please select a project first.");
      return;
    }

    if (!isProjectOwner) {
      setError("Only the project owner can add members.");
      return;
    }

    if (!email.trim()) {
      setError("Member email is required.");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add member");
      }

      setEmail("");

      // Refresh the members list
      const membersResponse = await fetch(
        `${API_URL}/api/projects/${selectedProject}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const membersData = await membersResponse.json();

      if (!membersResponse.ok) {
        throw new Error(
          membersData.message ||
            "Member added, but the list could not refresh"
        );
      }

      setMembers(membersData.members || []);
      setMessage("Team member added successfully!");
    } catch (err) {
      setError(err.message || "Could not add member");
    } finally {
      setAdding(false);
    }
  }

  // Remove a teammate from the selected project
  async function handleRemoveMember(memberId) {
    if (!isProjectOwner) {
      setError("Only the project owner can remove members.");
      return;
    }

    const confirmed = window.confirm(
      "Remove this user from the project? Their account will not be deleted."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setRemovingMember(memberId);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProject}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not remove member");
      }

      setMembers((current) =>
        current.filter(
          (member) => String(member._id) !== String(memberId)
        )
      );

      setMessage("Team member removed successfully!");
    } catch (err) {
      setError(err.message || "Could not remove member");
    } finally {
      setRemovingMember("");
    }
  }

  return (
    <section className="members-page">
      <div className="members-heading">
        <div>
          <span className="members-eyebrow">COLLABORATION</span>
          <h2>Team Members</h2>
          <p>Manage the people working on your projects.</p>
        </div>

        <span className="members-count">
          {members.length}{" "}
          {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      <div className="members-panel">
        <label htmlFor="member-project">Select project</label>

        <select
          id="member-project"
          value={selectedProject}
          onChange={(event) => setSelectedProject(event.target.value)}
          disabled={!projects.length || adding || Boolean(removingMember)}
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

        {isProjectOwner ? (
          <form
            className="add-member-form"
            onSubmit={handleAddMember}
          >
            <label htmlFor="member-email">
              Add a registered teammate
            </label>

            <div className="member-form-row">
              <input
                id="member-email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={adding}
                required
              />

              <button
                type="submit"
                disabled={adding || !selectedProject}
              >
                {adding ? "Adding..." : "＋ Add member"}
              </button>
            </div>

            <small>
              Enter the email address of an existing CollabSphere user.
            </small>
          </form>
        ) : (
          <p className="members-empty">
            Only the project owner can add or remove team members.
          </p>
        )}

        {error && (
          <p className="members-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="members-success" role="status">
            {message}
          </p>
        )}
      </div>

      <div className="members-list-panel">
        <h3>Project team</h3>

        {loading ? (
          <p className="members-empty">
            Loading team members...
          </p>
        ) : error && members.length === 0 ? (
          <p className="members-empty">
            Could not load members. Check the error message above.
          </p>
        ) : members.length === 0 ? (
          <p className="members-empty">
            No members found, or select a project to view its team.
          </p>
        ) : (
          <div className="members-list">
            {members.map((member) => {
              const isCurrentUser =
                String(member._id) === String(userId);

              return (
                <article
                  className="member-row"
                  key={member._id}
                >
                  <div className="member-avatar">
                    {member.name?.trim().charAt(0).toUpperCase() ||
                      "U"}
                  </div>

                  <div className="member-details">
                    <strong>
                      {member.name || "Unnamed user"}
                      {isCurrentUser ? " (You)" : ""}
                    </strong>
                    <span>{member.email}</span>
                  </div>

                  <span className="member-badge">
                    {String(selectedProjectData?.ownerId) ===
                    String(member._id)
                      ? "Owner"
                      : "Member"}
                  </span>

                  {isProjectOwner && !isCurrentUser && (
                    <button
                      type="button"
                      className="remove-member-button"
                      disabled={Boolean(removingMember)}
                      onClick={() =>
                        handleRemoveMember(member._id)
                      }
                    >
                      {removingMember === member._id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default TeamMembers;
