import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDeepBrowsing } from '@/providers/DeepBrowsingProvider'
import { useTranslation } from 'react-i18next'

export function ShowNewButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  const { deepBrowsing, lastScrollTop } = useDeepBrowsing()

  return (
    <div
      className={cn(
        'sticky top-[6.25rem] flex justify-center w-full my-2 z-30 duration-700 transition-transform',
        deepBrowsing && lastScrollTop > 800 ? '-translate-y-10' : ''
      )}
    >
      <Button size="lg" onClick={onClick} className="drop-shadow-xl shadow-primary/50">
        {t('show new notes')}
      </Button>
    </div>
  )
}
