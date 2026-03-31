import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    home: 'Home',
    dashboard: 'Dashboard',
    history: 'History',
    insights: 'Insights',
    admin_panel: 'Admin Panel',
    payment: 'Payment',
    intelligence_dashboard: 'Intelligence Dashboard',
    dashboard_subtitle: 'Multimodal trust analysis engine',
    stats_total_analyses: 'Total Analyses',
    stats_active_users: 'Active Users',
    stats_processing: 'Processing',
    stats_usage: 'Usage',
    analyses: 'analyses',
    recent_analyses: 'Recent Analyses',
    analysis_history_title: 'Analysis History',
    input_placeholder: 'Paste any text — news article, social media post, report, speech transcript — for deep trust analysis... (Ctrl+Enter to run)',
    select_audio_error: 'Select an audio file',
    select_video_error: 'Select a video file',
    run_analysis: 'Run Analysis',
    clear: 'Clear',
    warning: 'Warning:',
    trust_score: 'Trust Score',
    risk: 'Risk',
    signals: 'Detected Signals',
    summary_quote: '"{summary}"',
    emotions_distribution: 'Emotion Distribution',
    sentiment_polarity: 'Sentiment Polarity',
    positive_label: 'POSITIVE',
    negative_label: 'NEGATIVE',
    neutral_label: 'NEUTRAL',
    sentiment_explanation: 'Sentiment polarity score',
    payment_title: 'Payment Portal',
    payment_intro: 'Choose your payment option below.',
    payment_local: 'Local (Tunisia)',
    payment_local_desc: 'Support local currency payments via eDinar or bank transfer.',
    payment_international: 'International',
    payment_international_desc: 'Use Visa, MasterCard or PayPal for global payments.',
    logout: 'Logout',
    live: 'LIVE',
    offline: 'OFFLINE',
    switch_to_light: 'Switch to light',
    powerbi_dashboard: 'Power BI Dashboard',
    switch_to_dark: 'Switch to dark',
  },
  fr: {
    home: 'Accueil',
    dashboard: 'Tableau de bord',
    history: 'Historique',
    insights: 'Informations',
    admin_panel: 'Panneau Administratif',
    payment: 'Paiement',
    intelligence_dashboard: 'Tableau de bord d’Intelligence',
    dashboard_subtitle: 'Moteur d’analyse de confiance multimodal',
    stats_total_analyses: 'Analyses Totales',
    stats_active_users: 'Utilisateurs Actifs',
    stats_processing: 'Traitement',
    stats_usage: 'Utilisation',
    analyses: 'analyses',
    recent_analyses: 'Analyses récentes',
    analysis_history_title: 'Historique des analyses',
    input_placeholder: 'Collez n’importe quel texte — article de presse, post sur les réseaux sociaux, rapport, transcription de discours — pour une analyse approfondie de la confiance... (Ctrl+Entrée pour lancer)',
    select_audio_error: 'Sélectionnez un fichier audio',
    select_video_error: 'Sélectionnez un fichier vidéo',
    run_analysis: 'Lancer l’analyse',
    clear: 'Effacer',
    warning: 'Attention :',
    trust_score: 'Score de Confiance',
    risk: 'Risque',
    signals: 'Signaux détectés',
    summary_quote: '"{summary}"',
    emotions_distribution: 'Distribution des émotions',
    sentiment_polarity: 'Polarité du sentiment',
    positive_label: 'POSITIF',
    negative_label: 'NÉGATIF',
    neutral_label: 'NEUTRE',
    sentiment_explanation: 'Score de polarité du sentiment',
    payment_title: 'Portail de paiement',
    payment_intro: 'Choisissez votre option de paiement ci-dessous.',
    payment_local: 'Local (Tunisie)',
    payment_local_desc: "Prise en charge des paiements en devise locale via eDinar ou virement bancaire.",
    payment_international: 'International',
    payment_international_desc: 'Utilisez Visa, MasterCard ou PayPal pour les paiements mondiaux.',
    logout: 'Se déconnecter',
    live: 'EN LIGNE',
    offline: 'HORS LIGNE',
    switch_to_light: 'Passer en mode clair',
    powerbi_dashboard: 'Tableau de bord Power BI',
    switch_to_dark: 'Passer en mode sombre',
  },
  ar: {
    home: 'الرئيسية',
    dashboard: 'لوحة التحكم',
    history: 'السجل',
    insights: 'الرؤى',
    admin_panel: 'لوحة الإدارة',
    payment: 'الدفع',
    intelligence_dashboard: 'لوحة معلومات الذكاء',
    dashboard_subtitle: 'محرك تحليل الثقة متعدد الوسائط',
    stats_total_analyses: 'إجمالي التحليلات',
    stats_active_users: 'المستخدمون النشطون',
    stats_processing: 'المعالجة',
    stats_usage: 'الاستخدام',
    analyses: 'تحليلات',
    recent_analyses: 'تحليلات حديثة',
    analysis_history_title: 'سجل التحليلات',
    input_placeholder: 'الصق أي نص ــ مقال إخباري، منشور على وسائل التواصل الاجتماعي، تقرير، نص خطاب ــ لتحليل ثقة متعمق... (Ctrl+Enter للتشغيل)',
    select_audio_error: 'اختر ملف صوتي',
    select_video_error: 'اختر ملف فيديو',
    run_analysis: 'تشغيل التحليل',
    clear: 'مسح',
    warning: 'تحذير:',
    trust_score: 'درجة الثقة',
    risk: 'المخاطر',
    signals: 'الإشارات المكتشفة',
    summary_quote: '"{summary}"',
    emotions_distribution: 'توزيع المشاعر',
    sentiment_polarity: 'استقطاب المشاعر',
    positive_label: 'إيجابي',
    negative_label: 'سلبي',
    neutral_label: 'محايد',
    sentiment_explanation: 'درجة استقطاب المشاعر',
    payment_title: 'بوابة الدفع',
    payment_intro: 'اختر خيار الدفع أدناه.',
    payment_local: 'محلي (تونس)',
    payment_local_desc: 'ادعم المدفوعات بعملة محلية عبر eDinar أو التحويل المصرفي.',
    payment_international: 'دولي',
    payment_international_desc: 'استخدم Visa أو MasterCard أو PayPal للمدفوعات العالمية.',
    logout: 'تسجيل الخروج',
    live: 'متصل',
    offline: 'غير متصل',
    switch_to_light: 'التبديل إلى الفاتح',
    powerbi_dashboard: 'لوحة Power BI',
    switch_to_dark: 'التبديل إلى الداكن',
  }
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  // initialize language from localStorage or default to english
  const stored = localStorage.getItem('ts_lang')
  const [lang, setLangState] = useState(stored || 'en')

  const t = (key) => translations[lang]?.[key] || key

  const setLang = (newLang) => {
    setLangState(newLang)
    try {
      localStorage.setItem('ts_lang', newLang)
    } catch {}
    // persist on server if user is logged in
    import('../services/api').then(({ userAPI }) => {
      userAPI.updateLanguage(newLang).catch(() => {})
    })
  }

  // on mount, attempt to load preference from server (overrides localStorage) - only if authenticated
  useEffect(() => {
    // Only attempt to fetch from server if user is logged in
    const token = localStorage.getItem('ts_token')
    if (!token) return // Skip if not authenticated
    
    import('../services/api').then(({ userAPI }) => {
      userAPI.getPreferences().then(r => {
        const langFromServer = r.data?.language
        if (langFromServer && langFromServer !== lang) {
          setLangState(langFromServer)
          try { localStorage.setItem('ts_lang', langFromServer) } catch {}
        }
      }).catch(err => {
        // Failed to fetch language preference
      })
    })
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('LanguageContext not found')
  return ctx
}
