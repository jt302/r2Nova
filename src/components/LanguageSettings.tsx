import { Globe } from 'lucide-react'
import { useI18nStore, Language } from '../stores/i18nStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
]

export function LanguageSettings() {
  const { language, setLanguage, t } = useI18nStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>{t('settings.languageDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          value={language}
          onValueChange={value => {
            if (value) setLanguage(value as Language)
          }}
          className="justify-start gap-4"
        >
          {languages.map(({ value, label, flag }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              className="flex items-center gap-2 px-4 py-2 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <span className="text-xl">{flag}</span>
              <span className="font-medium">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardContent>
    </Card>
  )
}
