import React from "react";
import { LayoutDashboard, Timer, Archive, LifeBuoy, Menu, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  activePage: string;
  setActivePage: (page: string) => void;
  toggleSidebar: () => void;
}

export function Sidebar({ isOpen, activePage, setActivePage, toggleSidebar }: SidebarProps) {
  const navItems: { name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Time Entries", icon: Timer },
    { name: "Archive", icon: Archive },
    { name: "Help Requests", icon: LifeBuoy },
  ];

  return (
    <div className={`fixed top-0 left-0 h-screen bg-[#162944] text-white transition-all duration-300 ease-in-out z-30 ${isOpen ? "w-64" : "w-20"}`}>
      <div className={`flex items-center h-16 px-4 border-b border-gray-700 ${isOpen ? "justify-between" : "justify-center"}`}>
        <span className={`font-bold text-xl transition-opacity whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0"}`}>AV Platform</span>
        <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white" aria-label="Toggle sidebar">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActivePage(item.name);
            }}
            className={`flex items-center py-3 px-6 my-1 transition-colors duration-200 ${activePage === item.name ? "bg-black/25 text-white" : "text-gray-300 hover:bg-black/25 hover:text-white"}`}
            title={item.name}
          >
            <item.icon className="h-6 w-6" />
            <span className={`mx-4 font-medium transition-opacity whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0"}`}>{item.name}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

