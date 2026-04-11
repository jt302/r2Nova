import { useState, useMemo } from 'react'
import { useTransferStore } from '../stores/transferStore'
import { useTranslation } from '../stores/i18nStore'
import {
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) {
    return (mbps / 1000).toFixed(2) + ' GB/s'
  }
  return mbps.toFixed(1) + ' MB/s'
}

export function TransferCenter() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'all' | 'upload' | 'download'>('all')

  const tasks = useTransferStore(state => state.tasks)
  const removeTask = useTransferStore(state => state.removeTask)
  const clearCompleted = useTransferStore(state => state.clearCompleted)

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (activeTab === 'all') return true
      return task.type === activeTab
    })
  }, [tasks, activeTab])

  const stats = useMemo(() => {
    const active = tasks.filter(task => task.status === 'in_progress' || task.status === 'pending')
    const completed = tasks.filter(task => task.status === 'completed')
    const failed = tasks.filter(task => task.status === 'failed')

    const totalSpeed = tasks
      .filter(task => task.status === 'in_progress')
      .reduce((sum, task) => sum + (task.speedMbps || 0), 0)

    return { active, completed, failed, totalSpeed }
  }, [tasks])

  const getStatusBadge = (taskStatus: string) => {
    switch (taskStatus) {
      case 'completed':
        return (
          <Badge
            variant="default"
            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          >
            {t('transfer.completed')}
          </Badge>
        )
      case 'failed':
        return <Badge variant="destructive">{t('transfer.failed')}</Badge>
      case 'pending':
        return <Badge variant="secondary">{t('transfer.pending')}</Badge>
      default:
        return (
          <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
            {t('transfer.inProgress')}
          </Badge>
        )
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              {t('transfer.activeCount')}
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-4xl font-bold text-foreground">{stats.active.length}</span>
              <RefreshCw className="w-12 h-12 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              {t('transfer.completedCount')}
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-4xl font-bold text-foreground">{stats.completed.length}</span>
              <CheckCircle className="w-12 h-12 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              {t('transfer.failedCount')}
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-4xl font-bold text-destructive">{stats.failed.length}</span>
              <AlertCircle className="w-12 h-12 text-destructive/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col justify-center items-center text-center">
            <p className="text-muted-foreground text-xs mb-2 uppercase tracking-tighter">
              {t('transfer.totalBandwidth')}
            </p>
            <span className="text-2xl font-bold text-primary">{formatSpeed(stats.totalSpeed)}</span>
            <Progress
              value={Math.min((stats.totalSpeed / 100) * 100, 100)}
              className="w-full h-1 mt-3"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">{t('transfer.all')}</TabsTrigger>
            <TabsTrigger value="upload">{t('transfer.uploads')}</TabsTrigger>
            <TabsTrigger value="download">{t('transfer.downloads')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {stats.completed.length > 0 && (
          <Button
            variant="ghost"
            onClick={clearCompleted}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            {t('transfer.clearCompleted')}
          </Button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ArrowUpDown className="w-16 h-16 mb-4 opacity-20" />
          <p>{t('transfer.noTransfers')}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>{t('bucket.name')}</TableHead>
              <TableHead className="w-[120px]">{t('bucket.size')}</TableHead>
              <TableHead>{t('transfer.progress')}</TableHead>
              <TableHead className="w-[100px] text-right">{t('bucket.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map(task => {
              const progress =
                task.bytesTotal > 0 ? (task.bytesTransferred / task.bytesTotal) * 100 : 0
              const isInProgress = task.status === 'in_progress'
              const Icon = task.type === 'upload' ? Upload : Download

              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{task.filename}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Bucket: {task.bucket}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatBytes(task.bytesTotal)}
                  </TableCell>
                  <TableCell>
                    {isInProgress ? (
                      <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <div className="flex justify-between text-xs text-muted-foreground font-mono">
                          <span>
                            {progress.toFixed(0)}% • {formatSpeed(task.speedMbps || 0)}
                          </span>
                          <span>
                            {formatBytes(task.bytesTransferred)} / {formatBytes(task.bytesTotal)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    ) : (
                      getStatusBadge(task.status)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(task.id)}
                      className={
                        isInProgress
                          ? 'text-destructive hover:bg-destructive/10'
                          : 'text-muted-foreground'
                      }
                    >
                      {isInProgress ? <X className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
