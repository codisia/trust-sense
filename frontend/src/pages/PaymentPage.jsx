import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import { paymentAPI } from '../services/api'

export default function PaymentPage() {
  const { theme } = useTheme()
  const { t } = useLanguage()

  const [localAmount, setLocalAmount] = useState(0)
  const [intlAmount, setIntlAmount] = useState(0)
  const [localResult, setLocalResult] = useState(null)
  const [intlResult, setIntlResult] = useState(null)

  const handleLocal = async () => {
    try {
      const r = await paymentAPI.createLocalPayment(localAmount, 'TND')
      setLocalResult(r.data)
    } catch (e) {
      setLocalResult({ error: e.response?.data?.detail || e.message })
    }
  }

  const handleIntl = async () => {
    try {
      const r = await paymentAPI.createIntlPayment(intlAmount, 'USD')
      setIntlResult(r.data)
    } catch (e) {
      setIntlResult({ error: e.response?.data?.detail || e.message })
    }
  }

  // simplistic conversion rate example
  const usdToTnd = (usd) => (usd * 3.0).toFixed(2)

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '48px', color: theme.text }}>
      <h1 style={{ fontFamily: theme.fontDisplay, fontSize: '32px', marginBottom: '24px' }}>{t('payment_title')}</h1>
      <p>{t('payment_intro')}</p>
      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <h2>{t('payment_local')}</h2>
          <p>{t('payment_local_desc')}</p>
          <div style={{ marginTop: '16px' }}>
            <label>Amount (TND):</label><br />
            <input type="number" value={localAmount} onChange={e => setLocalAmount(Number(e.target.value))} style={{ padding: '6px', width: '120px', marginTop: '4px' }} />
            <div style={{ marginTop: '12px' }}>
              <Button onClick={handleLocal}>{t('run_analysis')}</Button>
            </div>
          </div>
          {localResult && (
            <div style={{ marginTop: '16px', fontSize: '13px' }}>
              {localResult.error ? <span style={{ color: theme.danger }}>{t('warning')} {localResult.error}</span> : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(localResult, null, 2)}</pre>}
            </div>
          )}
        </div>
        <div>
          <h2>{t('payment_international')}</h2>
          <p>{t('payment_international_desc')}</p>
          <div style={{ marginTop: '16px' }}>
            <label>Amount (USD):</label><br />
            <input type="number" value={intlAmount} onChange={e => setIntlAmount(Number(e.target.value))} style={{ padding: '6px', width: '120px', marginTop: '4px' }} />
            <div style={{ marginTop: '12px' }}>
              <Button onClick={handleIntl}>{t('run_analysis')}</Button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: theme.muted }}>
              Approx. {usdToTnd(intlAmount)} TND
            </div>
          </div>
          {intlResult && (
            <div style={{ marginTop: '16px', fontSize: '13px' }}>
              {intlResult.error ? <span style={{ color: theme.danger }}>{t('warning')} {intlResult.error}</span> : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(intlResult, null, 2)}</pre>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}