import { Link, Outlet, useLocation } from 'react-router';
import { MessageSquare, Search, Database, FolderOpen, LayoutDashboard, Settings, Sparkles } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Chat', href: '/', icon: MessageSquare },
    { name: 'Explorador de búsqueda', href: '/search', icon: Search },
    { name: 'Fuentes de conocimiento', href: '/sources', icon: Database },
    { name: 'Conocimiento', href: '/knowledge', icon: FolderOpen },
    { name: 'Dashboard del sistema', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-[#0a0e1a]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f1419] border-r border-[#1a2332] flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#1a2332]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563eb] to-[#1e40af] rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="font-semibold text-white">CMH Searcher</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm
                  ${active 
                    ? 'bg-[#1e3a8a]/20 text-blue-400 border border-[#1e40af]/40 shadow-sm' 
                    : 'text-slate-400 hover:bg-[#1a2332] hover:text-slate-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1a2332]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">v1.2.4</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-400">Conectado</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
