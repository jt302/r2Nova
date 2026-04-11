import { useTransferStore } from '../stores/transferStore'
import { useTranslation } from '../stores/i18nStore'
import { ArrowUpDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function TransferProgress() {
  const { t } = useTranslation()
  const tasks = useTransferStore(state => state.tasks)

  const activeTasks = tasks.filter(
    task => task.status === 'in_progress' || task.status === 'pending'
  )

  if (activeTasks.length === 0) return null

  const latestTask = activeTasks[0]
  const progress =
    latestTask.bytesTotal > 0 ? (latestTask.bytesTransferred / latestTask.bytesTotal) * 100 : 0

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-2xl border z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary" />
            {t('transfer.transferManager')}
          </CardTitle>
          <span className="text-[10px] text-primary font-bold">
            {t('transfer.inProgress')} ({activeTasks.length})
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="truncate w-40">{latestTask.filename}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {formatBytes(latestTask.bytesTransferred)} / {formatBytes(latestTask.bytesTotal)}
          </span>
          <span>{latestTask.speedMbps.toFixed(1)} MB/s</span>
        </div>

        {activeTasks.length > 1 && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary h-auto py-1"
            >
              {t('transfer.viewAll')} ({activeTasks.length})
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
