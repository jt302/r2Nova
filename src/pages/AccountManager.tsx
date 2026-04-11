import { useState } from 'react'
import { useAccountStore } from '../stores/accountStore'
import { accountService } from '../services/r2Service'
import { Account } from '../types'
import { useTranslation } from '../stores/i18nStore'
import {
  PlusCircle,
  UserCircle,
  Network,
  CheckCircle,
  Pencil,
  Trash2,
  PlusSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AccountManagerProps {
  onAccountSelect: (accountId: string) => void
}

export function AccountManager({ onAccountSelect }: AccountManagerProps) {
  const { t } = useTranslation()
  const { accounts, isLoading, error, loadAccounts, deleteAccount, updateAccount } =
    useAccountStore()
  const [isAdding, setIsAdding] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (
      !formData.name ||
      !formData.endpoint ||
      !formData.accessKeyId ||
      !formData.secretAccessKey
    ) {
      setFormError(t('account.fillAllFields'))
      return
    }

    try {
      await accountService.saveAccount(formData)
      setIsAdding(false)
      setFormData({ name: '', endpoint: '', accessKeyId: '', secretAccessKey: '' })
      loadAccounts()
    } catch (err) {
      let errorMessage = t('account.addFailed')
      if (err instanceof Error) {
        errorMessage = `${t('account.addFailed')}: ${err.message}`
      }
      setFormError(errorMessage)
    }
  }

  const handleDeleteClick = (id: string) => {
    setAccountToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return
    try {
      await deleteAccount(accountToDelete)
      setIsDeleteDialogOpen(false)
      setAccountToDelete(null)
    } catch (err) {
      console.error('Failed to delete account:', err)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account.id)
    setFormData({
      name: account.name,
      endpoint: account.endpoint,
      accessKeyId: account.access_key_id,
      secretAccessKey: '',
    })
    setFormError(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return

    setFormError(null)

    if (!formData.name || !formData.endpoint || !formData.accessKeyId) {
      setFormError(t('account.fillRequiredFields'))
      return
    }

    try {
      await updateAccount(editingAccount, formData)
      setEditingAccount(null)
      setFormData({ name: '', endpoint: '', accessKeyId: '', secretAccessKey: '' })
    } catch (err) {
      setFormError(
        err instanceof Error
          ? `${t('account.updateFailed')}: ${err.message}`
          : t('account.updateFailed')
      )
    }
  }

  const cancelEdit = () => {
    setEditingAccount(null)
    setFormData({ name: '', endpoint: '', accessKeyId: '', secretAccessKey: '' })
    setFormError(null)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-none mb-2">
            {t('account.cloudflareR2Accounts')}
          </h2>
          <p className="text-muted-foreground">{t('account.manageVaults')}</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <PlusCircle className="w-5 h-5" />
          {t('account.addNewAccount')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4">
        {accounts.length === 0 && !isAdding ? (
          <div className="text-center py-16 text-muted-foreground">
            <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{t('account.noAccounts')}</p>
          </div>
        ) : (
          accounts.map(account => (
            <Card key={account.id} className={account.is_active ? 'border-primary/50' : ''}>
              <CardContent className="p-6">
                {account.is_active && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      {t('account.currentlyActive')}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center text-primary border">
                    <Network className="w-8 h-8" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold">{account.name}</h3>
                      <span className="text-muted-foreground text-xs font-mono">
                        {account.endpoint.slice(0, 20)}...
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          {t('account.endpoint')}
                        </Label>
                        <p className="text-sm font-mono truncate mt-1">{account.endpoint}</p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          {t('account.accessKeyId')}
                        </Label>
                        <p className="text-sm font-mono mt-1">
                          {account.access_key_id.substring(0, 8)}...
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          {t('account.status')}
                        </Label>
                        <p className="text-sm text-primary flex items-center gap-1.5 mt-1">
                          <CheckCircle className="w-4 h-4" />
                          {t('account.connected')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button
                    onClick={() => onAccountSelect(account.id)}
                    disabled={account.is_active}
                    variant={account.is_active ? 'secondary' : 'default'}
                  >
                    {account.is_active ? t('account.selected') : t('account.select')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <PlusSquare className="w-6 h-6 text-primary" />
              <DialogTitle>{t('account.connectNew')}</DialogTitle>
            </div>
            <DialogDescription>Step 1: Configuration</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('account.accountName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('account.accountNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endpoint">{t('account.endpoint')}</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder={t('account.endpointPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessKeyId">{t('account.accessKeyId')}</Label>
                <Input
                  id="accessKeyId"
                  value={formData.accessKeyId}
                  onChange={e => setFormData({ ...formData, accessKeyId: e.target.value })}
                  placeholder="••••••••••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">{t('account.secretAccessKey')}</Label>
                <Input
                  id="secretAccessKey"
                  type="password"
                  value={formData.secretAccessKey}
                  onChange={e => setFormData({ ...formData, secretAccessKey: e.target.value })}
                  placeholder="••••••••••••••••••••••••••••"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                {t('common.discard')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.verifying') : t('account.verifyConnect')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAccount} onOpenChange={() => editingAccount && cancelEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Pencil className="w-6 h-6 text-primary" />
              <DialogTitle>{t('account.editSettings')}</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('account.accountName')}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endpoint">{t('account.endpoint')}</Label>
                <Input
                  id="edit-endpoint"
                  value={formData.endpoint}
                  onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accessKeyId">{t('account.accessKeyId')}</Label>
                <Input
                  id="edit-accessKeyId"
                  value={formData.accessKeyId}
                  onChange={e => setFormData({ ...formData, accessKeyId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-secretAccessKey">{t('account.secretAccessKey')}</Label>
                <Input
                  id="edit-secretAccessKey"
                  type="password"
                  placeholder={t('account.leaveEmpty')}
                  value={formData.secretAccessKey}
                  onChange={e => setFormData({ ...formData, secretAccessKey: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.saving') : t('account.updateConfig')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('account.confirmDelete')}</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t('dialog.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
