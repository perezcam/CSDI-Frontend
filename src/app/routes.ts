import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Chat } from "./pages/Chat";
import { Search } from "./pages/Search";
import { Sources } from "./pages/Sources";
import { Knowledge } from "./pages/Knowledge";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Chat },
      { path: "search", Component: Search },
      { path: "sources", Component: Sources },
      { path: "knowledge", Component: Knowledge },
      { path: "dashboard", Component: Dashboard },
      { path: "settings", Component: Settings },
    ],
  },
]);