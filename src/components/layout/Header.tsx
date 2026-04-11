import { Account } from '../../types'
import { useTranslation } from '../../stores/i18nStore'
import { UserCircle, Search, Bell, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface HeaderProps {
  currentAccount: Account | null
  onNavigate: () => void
}

export function Header({ currentAccount, onNavigate }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="w-full h-16 flex justify-between items-center px-6 sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
      <Breadcrumb>
        <BreadcrumbList>
          {currentAccount ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={e => {
                    e.preventDefault()
                    onNavigate()
                  }}
                  className="flex items-center gap-1"
                >
                  <UserCircle className="w-5 h-5" />
                  {currentAccount.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary font-bold">
                  {t('header.currentAccount')}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <span className="text-muted-foreground">{t('app.noAccount')}</span>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center bg-muted px-3 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-ring transition-all">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <Input
            className="bg-transparent border-0 p-0 focus-visible:ring-0 text-sm w-48 lg:w-64 placeholder:text-muted-foreground"
            placeholder={t('header.search')}
            type="text"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Cloud className="w-5 h-5" />
          </Button>
          <Avatar className="h-8 w-8 ml-2">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm">
              {currentAccount?.name?.charAt(0).toUpperCase() || 'R'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
