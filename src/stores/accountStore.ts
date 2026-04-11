import { create } from 'zustand'
import { Account } from '../types'
import { accountService } from '../services/r2Service'

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
      console.error('Failed to load accounts:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load accounts',
        isLoading: false,
      })
    }
  },

  addAccount: async input => {
    set({ isLoading: true, error: null })
    try {
      const account = await accountService.saveAccount(input)
      console.log('Account saved successfully:', account)
      set(state => ({
        accounts: [...state.accounts, account],
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to add account:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to add account',
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
      console.error('Failed to set current account:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to set current account',
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
      console.error('Failed to delete account:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to delete account',
        isLoading: false,
      })
      throw error
    }
  },

  updateAccount: async (id, input) => {
    set({ isLoading: true, error: null })
    try {
      const account = await accountService.updateAccount(id, input)
      console.log('Account updated successfully:', account)
      set(state => ({
        accounts: state.accounts.map(a => (a.id === id ? account : a)),
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to update account:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to update account',
        isLoading: false,
      })
      throw error
    }
  },
}))
