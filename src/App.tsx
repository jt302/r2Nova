import { useState, useEffect } from 'react'
import { UserCircle } from 'lucide-react'
import { AccountManager } from './pages/AccountManager'
import { BucketBrowser } from './pages/BucketBrowser'
import { TransferCenter } from './pages/TransferCenter'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { TransferProgress } from './components/TransferProgress'
import { ThemeSettings } from './components/ThemeSettings'
import { ThemeProvider } from './components/ThemeProvider'
import { useAccountStore } from './stores/accountStore'
import { initTransferListeners } from './stores/transferStore'
import { systemService } from './services/systemService'
import { useTranslation } from './stores/i18nStore'
import './App.css'

type ViewType = 'accounts' | 'buckets' | 'settings' | 'transfers'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('accounts')
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const { accounts, currentAccount, loadAccounts } = useAccountStore()
  const { t } = useTranslation()

  useEffect(() => {
    systemService.getAppInfo().then(info => {
      console.log('R2Nova App Info:', info)
    })

    loadAccounts()
    initTransferListeners()
  }, [loadAccounts])

  const handleAccountSelect = async (accountId: string) => {
    await useAccountStore.getState().setCurrentAccount(accountId)
    setCurrentView('buckets')
  }

  const handleBucketSelect = (bucketName: string) => {
    setSelectedBucket(bucketName)
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-background text-on-surface font-body">
        <Sidebar
          currentView={currentView}
          accounts={accounts}
          onNavigateAccounts={() => setCurrentView('accounts')}
          onNavigateBuckets={() => setCurrentView('buckets')}
          onNavigateSettings={() => setCurrentView('settings')}
          onNavigateTransfers={() => setCurrentView('transfers')}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-surface-container-low overflow-hidden">
          <Header currentAccount={currentAccount} onNavigate={() => setCurrentView('accounts')} />

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {currentView === 'accounts' && <AccountManager onAccountSelect={handleAccountSelect} />}
            {currentView === 'buckets' && currentAccount && (
              <BucketBrowser
                account={currentAccount}
                selectedBucket={selectedBucket}
                onBucketSelect={handleBucketSelect}
              />
            )}
            {currentView === 'buckets' && !currentAccount && (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center mb-4">
                  <UserCircle className="w-6 h-6 text-on-primary" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2">{t('app.noAccount')}</h3>
                <p className="text-sm mb-6">{t('app.noAccountDesc')}</p>
                <button
                  onClick={() => setCurrentView('accounts')}
                  className="px-4 py-2 bg-gradient-to-br from-primary-container to-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary-container/20 active:scale-95 transition-all"
                >
                  {t('app.addAccount')}
                </button>
              </div>
            )}
            {currentView === 'transfers' && <TransferCenter />}
            {currentView === 'settings' && <ThemeSettings />}
          </div>
        </main>

        <TransferProgress />
      </div>
    </ThemeProvider>
  )
}

export default App
