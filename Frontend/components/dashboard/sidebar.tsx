'use client';

import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Brain, 
  Shield, 
  FlaskConical, 
  Gauge,
  Settings 
} from 'lucide-react';

export type ViewType = 'dashboard' | 'narrative' | 'signal-guard' | 'experiments' | 'snvr';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const navItems: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'narrative', label: 'Narrative Intelligence', icon: Brain },
  { id: 'signal-guard', label: 'Signal Guard', icon: Shield },
  { id: 'experiments', label: 'Experiment Cards', icon: FlaskConical },
  { id: 'snvr', label: 'SNVR Scoring', icon: Gauge },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-[#1B3A5E] text-primary-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#234B73]">
        <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
          <span className="text-accent-foreground font-bold text-sm">A</span>
        </div>
        <span className="font-semibold text-lg tracking-tight">ARIA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                    isActive 
                      ? 'bg-[#234B73] border-l-2 border-accent text-primary-foreground' 
                      : 'text-primary-foreground/80 hover:bg-[#234B73]/50 hover:text-primary-foreground border-l-2 border-transparent'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings */}
      <div className="border-t border-[#234B73] py-4">
        <button className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-primary-foreground/80 hover:bg-[#234B73]/50 hover:text-primary-foreground transition-colors">
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
