import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import Topbar from "../components/Topbar";

export default function DashboardLayout() {
  return (
    <div className="
    flex min-h-screen 
    bg-gradient-to-br
    from-[#020617]
    via-[#0F172A]
    to-[#111827]
    text-white
    "
    >
      
      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Topbar />

        <main className="p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}