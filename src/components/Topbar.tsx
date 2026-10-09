import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="
      h-20
      border-b
      border-white/10
      px-6
      flex
      items-center
      justify-between
      bg-[#09090B]
    ">

      <div className="
        flex
        items-center
        gap-3
        bg-white/5
        px-4
        py-2
        rounded-2xl
        w-96
      ">
        <Search size={18} />

        <input
          placeholder="Buscar..."
          className="
            bg-transparent
            outline-none
            w-full
          "
        />
      </div>

      <button className="
        p-3
        rounded-2xl
        bg-white/5
        hover:bg-white/10
        transition-all
      ">
        <Bell size={20} />
      </button>

     <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className=" bg-red-500 px-4 py-2 rounded-xl text-white hover:bg-red-600 transition-all " > Cerrar sesion </button>
    </header>
  );    
}   