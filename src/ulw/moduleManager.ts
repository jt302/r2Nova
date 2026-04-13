import type { IModule, IModuleManager } from './types'

class ModuleManager implements IModuleManager {
  private modules = new Map<string, IModule>()
  private initialized = new Set<string>()
  private started = new Set<string>()

  register(module: IModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`)
    }
    this.modules.set(module.name, module)
  }

  unregister(name: string): void {
    const module = this.modules.get(name)
    if (module && this.started.has(name)) {
      module.stop()
      this.started.delete(name)
    }
    if (module && this.initialized.has(name)) {
      this.initialized.delete(name)
    }
    this.modules.delete(name)
  }

  get<T extends IModule>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined
  }

  async initAll(): Promise<void> {
    const modules = Array.from(this.modules.values())
    const sortedModules = this.sortByDependencies(modules)

    for (const module of sortedModules) {
      if (!this.initialized.has(module.name)) {
        await module.init()
        this.initialized.add(module.name)
      }
    }
  }

  async startAll(): Promise<void> {
    const modules = Array.from(this.modules.values())
    const sortedModules = this.sortByDependencies(modules)

    for (const module of sortedModules) {
      if (this.initialized.has(module.name) && !this.started.has(module.name)) {
        await module.start()
        this.started.add(module.name)
      }
    }
  }

  async stopAll(): Promise<void> {
    const modules = Array.from(this.modules.values()).reverse()

    for (const module of modules) {
      if (this.started.has(module.name)) {
        await module.stop()
        this.started.delete(module.name)
      }
    }
  }

  private sortByDependencies(modules: IModule[]): IModule[] {
    const visited = new Set<string>()
    const temp = new Set<string>()
    const result: IModule[] = []

    const visit = (module: IModule) => {
      if (temp.has(module.name)) {
        throw new Error(`Circular dependency detected at ${module.name}`)
      }
      if (visited.has(module.name)) {
        return
      }

      temp.add(module.name)

      if (module.dependencies) {
        for (const depName of module.dependencies) {
          const dep = this.modules.get(depName)
          if (dep) {
            visit(dep)
          }
        }
      }

      temp.delete(module.name)
      visited.add(module.name)
      result.push(module)
    }

    for (const module of modules) {
      visit(module)
    }

    return result
  }
}

export const moduleManager: IModuleManager = new ModuleManager()
