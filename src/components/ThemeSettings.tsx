import { useState, useEffect } from 'react'
import { useThemeStore, ThemeMode } from '../stores/themeStore'
import { useTranslation, Language } from '../stores/i18nStore'
import {
  Moon,
  Sun,
  Settings,
  Palette,
  Paintbrush,
  Globe,
  Plus,
  Settings2,
  RotateCcw,
  Info,
  Rocket,
  BookOpen,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const themeModes: { value: ThemeMode; labelKey: string; icon: typeof Moon }[] = [
  { value: 'dark', labelKey: 'theme.darkMode', icon: Moon },
  { value: 'light', labelKey: 'theme.lightMode', icon: Sun },
  { value: 'system', labelKey: 'theme.system', icon: Settings },
]

// 预设颜色 - hex 和对应的 HSL hue 值
const presetColors = [
  { nameKey: 'theme.cyberOrange', value: '#f38020', hue: 27 },
  { nameKey: 'theme.tertiaryBlue', value: '#89ceff', hue: 203 },
  { nameKey: 'theme.errorRed', value: '#ffb4ab', hue: 6 },
  { nameKey: 'theme.surfaceBlue', value: '#c9e6ff', hue: 207 },
  { nameKey: 'theme.secondary', value: '#b9c7df', hue: 217 },
]

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0

  if (max !== min) {
    const d = max - min
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return Math.round(h * 360)
}

export function ThemeSettings() {
  const { t, language, setLanguage } = useTranslation()
  const { mode, setMode, setCustomPrimaryColor, resetCustomColors, customColors } = useThemeStore()
  const [activeColor, setActiveColor] = useState(presetColors[0].value)

  useEffect(() => {
    const currentHue = parseInt(customColors.primary.split(' ')[0])
    const matchedColor = presetColors.find(c => c.hue === currentHue)
    if (matchedColor) {
      setActiveColor(matchedColor.value)
    }
  }, [customColors.primary])

  const handleColorChange = (hexValue: string, hue: number) => {
    setActiveColor(hexValue)
    setCustomPrimaryColor(hue)
  }

  const handleReset = () => {
    resetCustomColors()
    setActiveColor(presetColors[0].value)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full pb-24">
      <h2 className="text-lg font-extrabold tracking-tight mb-8">
        {t('settings.systemConfiguration')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card className="md:col-span-4">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-base">
              <Palette className="w-5 h-5 text-primary" />
              {t('settings.appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={value => {
                if (value) setMode(value as ThemeMode)
              }}
              className="grid grid-cols-3 gap-4"
            >
              {themeModes.map(({ value, labelKey, icon: Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className="flex flex-col items-center gap-3 h-auto py-4 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-sm font-medium">{t(labelKey)}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-base">
              <Globe className="w-5 h-5 text-muted-foreground" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">{t('settings.languageDesc')}</p>
            <Select value={language} onValueChange={value => setLanguage(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-base">
                <Paintbrush className="w-5 h-5 text-primary" />
                {t('settings.themeColor')}
              </CardTitle>
              <Badge variant="secondary">{activeColor}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-green-500 via-blue-500 via-purple-500 to-red-500">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full border-4 border-border shadow-xl cursor-pointer transition-all"
                style={{
                  left: `${(hexToHue(activeColor) / 360) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {presetColors.map(({ nameKey, value, hue }) => (
                <button
                  key={value}
                  onClick={() => handleColorChange(value, hue)}
                  className="w-10 h-10 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{
                    backgroundColor: value,
                    boxShadow:
                      activeColor === value
                        ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary))`
                        : undefined,
                  }}
                  title={t(nameKey)}
                />
              ))}
              <button className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-base">
              <Settings2 className="w-5 h-5 text-destructive" />
              {t('settings.general')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-sm text-muted-foreground mb-6">{t('settings.resetDesc')}</p>
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('settings.resetDefaults')}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-[0.03] select-none pointer-events-none">
            <Rocket className="w-[200px] h-[200px]" />
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">{t('settings.aboutVault')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-black tracking-tighter">R2Nova</h4>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Version 1.0.0 (Kinetic Flux)
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-sm text-primary flex items-center gap-2 hover:underline"
                >
                  <BookOpen className="w-4 h-4" />
                  {t('settings.apiDocs')}
                </a>
                <a
                  href="#"
                  className="text-sm text-primary flex items-center gap-2 hover:underline"
                >
                  <Shield className="w-4 h-4" />
                  {t('settings.privacyPolicy')}
                </a>
              </div>
            </div>
            <Separator className="my-6" />
            <p className="text-[10px] text-muted-foreground/60">
              © 2024 R2Nova Kinetic Vault. {t('settings.builtFor')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
