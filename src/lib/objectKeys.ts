export function buildFolderKey(currentPrefix: string, folderName: string): string {
  const normalizedPrefix =
    currentPrefix.length > 0 && !currentPrefix.endsWith('/') ? `${currentPrefix}/` : currentPrefix
  const normalizedName = folderName.replace(/^\/+|\/+$/g, '')

  return `${normalizedPrefix}${normalizedName}/`
}
