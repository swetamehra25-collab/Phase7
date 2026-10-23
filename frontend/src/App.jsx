import { useState } from "react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import PublicProject from "./PublicProject";
import { useEffect } from "react";

function App() {
  const [authData, setAuthData] = useState(() => {
    try {
      const token = sessionStorage.getItem("collabsphere_token");
      const userData = sessionStorage.getItem("collabsphere_user");

      if (!token || !userData) return null;

      return { token, user: JSON.parse(userData) };
    } catch {
      sessionStorage.removeItem("collabsphere_token");
      sessionStorage.removeItem("collabsphere_user");
      return null;
    }
  });

  // Public share links work without logging in.
  const publicMatch = window.location.pathname.match(/^\/public\/([^/]+)\/?$/);
  if (publicMatch) {
    return <PublicProject projectId={decodeURIComponent(publicMatch[1])} />;
  }

  function handleAuthSuccess(data) {
    if (!data?.token || !data?.user) return;

    sessionStorage.setItem("collabsphere_token", data.token);
    sessionStorage.setItem("collabsphere_user", JSON.stringify(data.user));
    setAuthData({ token: data.token, user: data.user });
  }

  function handleLogout() {
    sessionStorage.removeItem("collabsphere_token");
    sessionStorage.removeItem("collabsphere_user");
    setAuthData(null);
  }

  function handleUserUpdate(updatedUser) {
    try {
      const token = authData?.token;
      if (token && updatedUser) {
        sessionStorage.setItem("collabsphere_user", JSON.stringify(updatedUser));
        setAuthData({ token, user: updatedUser });
      }
    } catch (_) {
      // ignore
    }
  }

  useEffect(() => {
    const theme = authData?.user?.preferences?.theme || "default";
    const root = document.documentElement;
    root.classList.remove("theme-default", "theme-dark", "theme-light");
    root.classList.add(`theme-${theme}`);

    return () => {
      root.classList.remove("theme-default", "theme-dark", "theme-light");
    };
  }, [authData?.user?.preferences?.theme]);

  if (!authData) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Dashboard
      user={authData.user}
      token={authData.token}
      onLogout={handleLogout}
      onUserUpdate={handleUserUpdate}
    />
  );
}

export default App;