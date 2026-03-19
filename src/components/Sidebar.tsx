import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  FolderOpen,
  Clock,
  Settings,
  Scale,
  FilePlus,
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Sociétés', href: '/companies', icon: Building2 },
  { name: 'Nouveau document', href: '/generate', icon: FilePlus },
  { name: 'Bibliothèque de modèles', href: '/templates', icon: FolderOpen },
  { name: 'Historique', href: '/history', icon: Clock },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 shadow-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 leading-none">OHADA Draft</h1>
            <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wider">Rédaction juridique</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-200">
        <p className="text-[10px] text-neutral-400 text-center">
          OHADA Draft v1.0.0
        </p>
      </div>
    </aside>
  );
}
