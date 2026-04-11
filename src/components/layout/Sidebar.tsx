import { Account } from '../../types'
import { useTranslation } from '../../stores/i18nStore'
import { useTransferStore } from '../../stores/transferStore'
import {
  Database,
  UserCircle,
  ArrowUpDown,
  Settings,
  Plus,
  HelpCircle,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentView: 'accounts' | 'buckets' | 'settings' | 'transfers'
  accounts: Account[]
  onNavigateAccounts: () => void
  onNavigateBuckets: () => void
  onNavigateSettings: () => void
  onNavigateTransfers: () => void
}

export function Sidebar({
  currentView,
  onNavigateAccounts,
  onNavigateBuckets,
  onNavigateSettings,
  onNavigateTransfers,
}: SidebarProps) {
  const { t } = useTranslation()
  const tasks = useTransferStore(state => state.tasks)

  const activeTaskCount = tasks.filter(
    task => task.status === 'in_progress' || task.status === 'pending'
  ).length

  const navItems = [
    {
      id: 'buckets' as const,
      label: t('nav.buckets'),
      icon: Database,
      onClick: onNavigateBuckets,
    },
    {
      id: 'accounts' as const,
      label: t('nav.accounts'),
      icon: UserCircle,
      onClick: onNavigateAccounts,
    },
    {
      id: 'transfers' as const,
      label: t('nav.transfers'),
      icon: ArrowUpDown,
      onClick: onNavigateTransfers,
      badge: activeTaskCount > 0 ? activeTaskCount : undefined,
    },
    {
      id: 'settings' as const,
      label: t('nav.settings'),
      icon: Settings,
      onClick: onNavigateSettings,
    },
  ]

  return (
    <aside className="h-full w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 bg-card border-r">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-black text-primary tracking-tighter">R2Nova</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {t('app.tagline')}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => {
          const isActive = currentView === item.id
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={e => {
                e.preventDefault()
                item.onClick()
              }}
              className={cn(
                'w-full justify-start gap-3 px-3 py-2.5 font-medium text-sm rounded-lg relative',
                isActive
                  ? 'bg-muted text-primary before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-primary before:rounded-r-full'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="default" className="text-xs px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={onNavigateTransfers}
          className="w-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('transfer.newTransfer')}
        </Button>
      </div>

      <div className="p-3 mb-2">
        <div className="flex items-center gap-1">
          <Button
            variant="link"
            size="sm"
            className="flex-1 justify-start text-muted-foreground text-[11px]"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            {t('nav.support')}
          </Button>
          <Button
            variant="link"
            size="sm"
            className="flex-1 justify-start text-muted-foreground text-[11px]"
          >
            <Terminal className="w-4 h-4 mr-2" />
            {t('nav.logs')}
          </Button>
        </div>
      </div>
    </aside>
  )
}
