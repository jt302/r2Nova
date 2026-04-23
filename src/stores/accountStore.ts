import { create } from 'zustand'
import { Account } from '../types'
import { accountService } from '../services/r2Service'
import { logger } from '../services/loggerService'
import { useI18nStore } from './i18nStore'

interface AccountState {
  accounts: Account[]
  currentAccount: Account | null
  isLoading: boolean
  error: string | null
  loadAccounts: () => Promise<void>
  addAccount: (input: {
    name: string
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
  }) => Promise<void>
  updateAccount: (
    id: string,
    input: {
      name: string
      endpoint: string
      accessKeyId: string
      secretAccessKey: string
    }
  ) => Promise<void>
  setCurrentAccount: (id: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
}

function translatedError(key: string, error: unknown): string {
  return error instanceof Error ? error.message : useI18nStore.getState().t(key)
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  currentAccount: null,
  isLoading: false,
  error: null,

  loadAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await accountService.listAccounts()
      set({
        accounts: result.accounts,
        currentAccount: result.accounts.find(a => a.id === result.active_account_id) || null,
        isLoading: false,
      })
    } catch (error) {
      logger.error('Failed to load accounts', { error: String(error) })
      set({
        error: translatedError('error.loadAccountsFailed', error),
        isLoading: false,
      })
    }
  },

  addAccount: async input => {
    set({ isLoading: true, error: null })
    try {
      const account = await accountService.saveAccount(input)
      logger.info('Account saved successfully', { accountId: account.id })
      set(state => ({
        accounts: [...state.accounts, account],
        isLoading: false,
      }))
    } catch (error) {
      logger.error('Failed to add account', { error: String(error) })
      set({
        error: translatedError('error.saveAccountFailed', error),
        isLoading: false,
      })
      throw error
    }
  },

  setCurrentAccount: async id => {
    set({ isLoading: true, error: null })
    try {
      await accountService.setCurrentAccount(id)
      const account = get().accounts.find(a => a.id === id) || null
      set({ currentAccount: account, isLoading: false })
    } catch (error) {
      logger.error('Failed to set current account', { error: String(error) })
      set({
        error: translatedError('error.noActiveAccount', error),
        isLoading: false,
      })
      throw error
    }
  },

  deleteAccount: async id => {
    set({ isLoading: true, error: null })
    try {
      await accountService.deleteAccount(id)
      set(state => ({
        accounts: state.accounts.filter(a => a.id !== id),
        currentAccount: state.currentAccount?.id === id ? null : state.currentAccount,
        isLoading: false,
      }))
    } catch (error) {
      logger.error('Failed to delete account', { error: String(error) })
      set({
        error: translatedError('error.deleteAccountFailed', error),
        isLoading: false,
      })
      throw error
    }
  },

  updateAccount: async (id, input) => {
    set({ isLoading: true, error: null })
    try {
      const account = await accountService.updateAccount(id, input)
      logger.info('Account updated successfully', { accountId: account.id })
      set(state => ({
        accounts: state.accounts.map(a => (a.id === id ? account : a)),
        isLoading: false,
      }))
    } catch (error) {
      logger.error('Failed to update account', { error: String(error) })
      set({
        error: translatedError('account.updateFailed', error),
        isLoading: false,
      })
      throw error
    }
  },
}))
