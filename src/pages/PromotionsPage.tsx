import { useTranslation } from 'react-i18next'

export default function PromotionsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-cake-700">{t('nav.promotions')}</h1>
      <p className="text-sm text-gray-500">{t('common.comingSoon')}</p>
    </div>
  )
}
