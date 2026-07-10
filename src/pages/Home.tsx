import { Box, Button, Typography, Paper, Card, Skeleton, Container, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import NavBar from '../components/NavBar'
import anrLogo from '../assets/logos/ANR-cop.png'
import culturelabLogo from '../assets/logos/culture.png'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const homeTranslations = {
  en: {
    daily: 'THE DAILY',
    startQuiz: 'Start Quiz',
    contactUs: 'Contact Us',
    contactTitle: 'Contact Us',
    contactBody: 'To reach the team about anything, including questions regarding how your data is handled, or whether you would like to withdraw your consent to participate in our research, please contact:',
    close: 'Close',
    giveFeedback: 'Give Feedback',
    feedbackTitle: 'Give Feedback',
    feedbackPlaceholder: 'Share your thoughts, suggestions, or anything else...',
    feedbackSubmit: 'Submit',
    feedbackThanks: 'Thank you for your feedback!',
    noGames: 'No games yet — play your first quiz to see your stats!',
    games: 'Games',
    best: 'Best',
    average: 'Average',
    totalScore: 'Total Score',
    progression: 'Your Progression',
    attentionHeader: 'Attention Clever Readers',
    todaysNews: "Today's News",
    otherStories: 'Other Stories',
    yourStats: 'Your Stats',
  },
  fr: {
    daily: 'LE QUOTIDIEN',
    startQuiz: 'Commencer le quiz',
    contactUs: 'Nous contacter',
    contactTitle: 'Nous contacter',
    contactBody: "Pour contacter l'équipe pour toute question, notamment concernant la gestion de vos données ou si vous souhaitez retirer votre consentement à participer à notre recherche, veuillez contacter :",
    close: 'Fermer',
    giveFeedback: 'Donner un avis',
    feedbackTitle: 'Donner un avis',
    feedbackPlaceholder: 'Partagez vos impressions, suggestions ou autre chose...',
    feedbackSubmit: 'Envoyer',
    feedbackThanks: 'Merci pour votre retour !',
    noGames: "Pas encore de parties — jouez votre premier quiz pour voir vos statistiques !",
    games: 'Parties',
    best: 'Meilleur',
    average: 'Moyenne',
    totalScore: 'Score total',
    progression: 'Votre progression',
    attentionHeader: 'Attention Lecteurs Perspicaces',
    todaysNews: "Actualité du jour",
    otherStories: 'Autres articles',
    yourStats: 'Vos Stats',
  },
}

interface QuizSession {
  id?: number
  quiz_id: string
  score: number
  created_at: number | string
  ended_at: number | string | null
}

type AnimatedTextPart = {
  text: string
  color: string
}

const maskedArticleText = {
  en: [
    { text: 'Certain', color: '' },
    { text: ' ', color: '' },
    { text: 'words', color: '' },
    { text: ' have been removed from this ', color: '' },
    { text: '_______', color: '#FF6B6B' },
    { text: '. Can you ', color: '' },
    { text: '_____', color: '#4ECDC4' },
    { text: ' what they are? Use the color-coded hints and your ', color: '' },
    { text: '_________', color: '#4CAF50' },
    { text: ' to fill in the blanks before time runs out. Every correct ', color: '' },
    { text: '______', color: '#FFE66D' },
    { text: ' earns you ', color: '' },
    { text: '______', color: '#C7CEEA' },
    { text: '. Good luck!!', color: '' },
  ],
  fr: [
    { text: 'Certains mots ont été supprimés de cet ', color: '' },
    { text: '_______', color: '#FF6B6B' },
    { text: '. Pouvez-vous ', color: '' },
    { text: '_____', color: '#4ECDC4' },
    { text: " deviner ce qu'ils sont ? Utilisez les indices colorés et votre ", color: '' },
    { text: '_________', color: '#4CAF50' },
    { text: ' pour remplir les blancs avant la fin du temps. Chaque bonne ', color: '' },
    { text: '______', color: '#FFE66D' },
    { text: ' vous rapporte ', color: '' },
    { text: '______', color: '#C7CEEA' },
    { text: '. Bonne chance !!', color: '' },
  ],
}

function useUserStats() {
  return useQuery<QuizSession[]>({
    queryKey: ['quiz-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/quiz-sessions', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch sessions')
      return res.json()
    },
  })
}

function AnimatedNewspaper() {
  const { lang } = useLang()
  const t = homeTranslations[lang]
  const maskedArticle = maskedArticleText[lang]
  const [displayText, setDisplayText] = useState<Array<string | AnimatedTextPart>>([])
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    setDisplayText([])
    setIsTyping(true)
  }, [lang])

  useEffect(() => {
    if (!isTyping) return

    let charIndex = 0
    const timer = setInterval(() => {
      let currentChar = 0
      const builtText: Array<string | AnimatedTextPart> = []

      for (let i = 0; i < maskedArticle.length; i++) {
        const item = maskedArticle[i]
        const itemText = item.text

        if (currentChar + itemText.length <= charIndex) {
          builtText.push(item)
          currentChar += itemText.length
        } else if (currentChar < charIndex) {
          const partial = itemText.substring(0, charIndex - currentChar)
          builtText.push({ text: partial, color: item.color })
          break
        } else {
          break
        }
      }

      if (charIndex < maskedArticle.reduce((sum, item) => sum + item.text.length, 0)) {
        setDisplayText(builtText)
        charIndex++
      } else {
        setIsTyping(false)
      }
    }, 30)

    return () => clearInterval(timer)
  }, [isTyping, maskedArticle])

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 0,
        border: '2px solid #000',
        background: '#fff',
        boxShadow: 'none',
        maxWidth: '400px',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Newsreader, serif',
          fontSize: '11px',
          letterSpacing: '1.5px',
          color: '#666',
          mb: 1.5,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {t.attentionHeader}
      </Typography>
      <Box
        sx={{
          fontFamily: 'Newsreader, serif',
          fontSize: '13px',
          lineHeight: '1.8',
          color: '#000',
          fontStyle: 'italic',
          minHeight: '100px',
        }}
      >
        {displayText.map((item, idx) => {
          if (typeof item === 'string') {
            return <span key={idx}>{item}</span>
          }
          return (
            <span
              key={idx}
              style={{
                backgroundColor: item.color,
                padding: '2px 4px',
                borderRadius: '2px',
                fontWeight: '600',
              }}
            >
              {item.text}
            </span>
          )
        })}
        {isTyping && <span style={{ animation: 'blink 0.7s infinite' }}>|</span>}
      </Box>
      <style>
        {`
          @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `}
      </style>
    </Paper>
  )
}

function StatsSection() {
  const { data: sessions, isLoading } = useUserStats()
  const { lang } = useLang()
  const t = homeTranslations[lang]

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', maxWidth: 700, mt: 4 }}>
        <Skeleton variant="rounded" height={220} />
      </Box>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Typography sx={{ fontFamily: 'Newsreader, serif', mt: 3, color: '#666' }}>
        {t.noGames}
      </Typography>
    )
  }

  const best = Math.max(...sessions.map((s) => s.score))
  const total = sessions.length
  const average = Math.round((sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) * 10) / 10

  const POSColors: Record<string, string> = {
    '1111': '#FF6B6B',
    '2222': '#4ECDC4',
    '3333': '#4CAF50',
    '4444': '#FFE66D',
    '5555': '#C7CEEA',
    '6666': '#FFA500',
  }

  const chartData: {
    game: number
    score: number
    date: string
    blocks: { color: string }[]
    sessionId?: number
  }[] = []

  sessions.forEach((s, i) => {
    const ts = typeof s.created_at === 'string' ? Number(s.created_at) : s.created_at
    const d = ts ? new Date(Number(ts)) : null
    let dateStr = `Game ${i + 1}`
    if (d && !isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const ms = d.getMilliseconds().toString().padStart(3, '0')
      dateStr = `${datePart} ${timePart}.${ms}`
    }

    const blocks: { color: string }[] = []
    const correctGuesses = (s as any).correct_guesses || []

    if (Array.isArray(correctGuesses) && correctGuesses.length > 0) {
      correctGuesses.forEach((guess: { part_of_speech: string }) => {
        const pos = guess.part_of_speech || ''
        const color = POSColors[pos] || '#999'
        blocks.push({ color })
      })
    }

    if (blocks.length === 0) {
      blocks.push({ color: '#ccc' })
    }

    chartData.push({
      game: i + 1,
      score: s.score,
      date: dateStr,
      blocks,
      sessionId: (s as any).id ?? null,
    })
  })
  console.log('Chart data:', chartData)

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        {[
          { value: total, label: t.games, dark: false },
          { value: best, label: t.best, dark: false },
          { value: average, label: t.average, dark: false },
          { value: sessions.reduce((sum, s) => sum + s.score, 0), label: t.totalScore, dark: true },
        ].map(({ value, label, dark }) => (
          <Card
            key={label}
            sx={{
              px: 2.5, py: 2.5, borderRadius: 0,
              background: dark ? '#000' : '#fff',
              border: '2px solid #000',
              boxShadow: 'none',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                transform: 'translate(-1px, -1px)',
              },
            }}
          >
            <Typography sx={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 'bold', color: dark ? '#fff' : '#000', letterSpacing: '-1px' }}>
              {value}
            </Typography>
            <Box sx={{ height: '1px', background: dark ? '#fff' : '#000', my: 1.2, mx: 0 }} />
            <Typography sx={{ fontFamily: 'Newsreader, serif', fontSize: '9px', color: dark ? '#e0e0e0' : '#333', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 500 }}>
              {label}
            </Typography>
          </Card>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 0, border: '2px solid #000', background: '#fafafa', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <Typography
          sx={{ fontFamily: 'Newsreader, serif', fontSize: '13px', color: '#333', mb: 2.5, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500 }}
        >
          {t.progression}
        </Typography>
        <ResponsiveContainer width="100%" height={total > 20 ? 320 : 220}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -12, bottom: 10 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity={1} />
                <stop offset="50%" stopColor="#333" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#000" stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.08)" vertical={false} />
            <XAxis
              dataKey="game"
              tick={{ fontSize: 8, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              type={total > 50 ? 'number' : 'category'}
              {...(total > 50 ? { domain: [1, 'dataMax'], tickCount: Math.min(10, Math.ceil(total / 10)) } : {})}
              interval={Math.max(0, Math.floor(total / 15))}
            />
            <YAxis tick={{ fontSize: 8, fill: '#888' }} tickLine={false} axisLine={false} domain={[0, 600]} />
            <Tooltip
              contentStyle={{ borderRadius: 0, border: '1px solid #000', boxShadow: '2px 2px 8px rgba(0,0,0,0.15)', fontSize: 12, backgroundColor: '#fff', padding: '10px 12px' }}
              formatter={(value) => String(value)}
              labelFormatter={(_label, payload) => {
                const item = payload?.[0]?.payload as { date?: string; game?: number; score?: number } | undefined
                return `Game ${item?.game ?? ''} - Score: ${item?.score ?? 0}`
              }}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="score" radius={[0, 0, 0, 0]} shape={<CustomBlockShape chartData={chartData} />} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  )
}

interface CustomBlockShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  chartData: Array<{
    game: number
    score: number
    blocks: { color: string }[]
  }>
}

const CustomBlockShape = (props: CustomBlockShapeProps) => {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, chartData } = props
  const entry = chartData[index]

  if (!entry || !entry.blocks.length) return null

  const numBlocks = entry.blocks.length
  const blockHeight = Math.max(2, height / numBlocks)
  const blockWidth = Math.max(4, width - 2)

  return (
    <g>
      {entry.blocks.map((block: { color: string }, blockIdx: number) => {
        const blockY = y + height - (blockIdx + 1) * blockHeight
        return (
          <rect
            key={`block-${index}-${blockIdx}`}
            x={x + 1}
            y={blockY}
            width={blockWidth}
            height={blockHeight}
            fill={block.color}
            stroke="#fff"
            strokeWidth={0.5}
          />
        )
      })}
    </g>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lang } = useLang()
  const t = homeTranslations[lang]
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  return (
    <>
      <NavBar />
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowX: 'hidden',
          overflowY: 'auto',
          py: 4,
          px: { xs: 2, md: 8 },
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            mb: 4,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '16px',
                fontStyle: 'italic',
                letterSpacing: '1px',
                mb: 0.15,
                color: '#333',
              }}
            >
              {t.daily}
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Didot, Georgia, serif',
                fontSize: { xs: '40px', md: '64px' },
                fontWeight: 'bold',
                fontStyle: 'italic',
                letterSpacing: '1.5px',
                mb: 0.5,
              }}
            >
              NewsGap
            </Typography>

            <Box sx={{ display: 'inline-flex', gap: 1 }}>
              <Button

                onClick={() => navigate('/quiz', { state: { daily: true } })}
                sx={{
                  fontFamily: 'Libre Franklin, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  px: 4,
                  py: 2,
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: 0,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  '&:hover': { backgroundColor: '#222' },
                  transition: 'background 0.2s ease',
                }}
              >
                {t.todaysNews}
              </Button>
              <Button

                onClick={() => navigate('/quiz')}
                sx={{
                  fontFamily: 'Libre Franklin, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  px: 4,
                  py: 2,
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: 0,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  '&:hover': { backgroundColor: '#222' },
                  transition: 'background 0.2s ease',
                }}
              >
                {t.otherStories}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <AnimatedNewspaper />
          </Box>
        </Box>

        {user && (
          <Container maxWidth="md">
            <StatsSection />
          </Container>
        )}

        {/* Footer */}
        <Box
          sx={{
            mt: 'auto',
            pt: { xs: 4, md: 8 },
            pb: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1.5, md: 2.5 },
            opacity: 0.55,
            transition: 'opacity 0.3s ease',
            '&:hover': { opacity: 0.75 },
          }}
        >
          <img src={anrLogo} alt="ANR" style={{ height: 'clamp(24px, 3.5vw, 40px)', width: 'auto' }} />
          <Box sx={{ width: 1, height: 16, borderLeft: '1px solid #999', opacity: 0.3 }} />
          <img
            src={culturelabLogo}
            alt="CultureLab"
            style={{ height: 'clamp(24px, 3.5vw, 40px)', width: 'auto', filter: 'drop-shadow(0px 0px 0.8px #000)' }}
          />
          <Box sx={{ width: 1, height: 16, borderLeft: '1px solid #999', opacity: 0.3 }} />
          <Typography
            component="button"
            onClick={() => setContactDialogOpen(true)}
            sx={{
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              color: '#666',
              textDecoration: 'underline',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: 0,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              '&:hover': { color: '#333' },
            }}
          >
            {t.contactUs}
          </Typography>
          <Box sx={{ width: 1, height: 16, borderLeft: '1px solid #999', opacity: 0.3 }} />
          <Typography
            component="button"
            onClick={() => { setFeedbackDialogOpen(true); setFeedbackSubmitted(false); setFeedbackText('') }}
            sx={{
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              color: '#666',
              textDecoration: 'underline',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: 0,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              '&:hover': { color: '#333' },
            }}
          >
            {t.giveFeedback}
          </Typography>
        </Box>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 600 }}>{t.feedbackTitle}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {feedbackSubmitted ? (
              <Typography sx={{ fontSize: '0.95rem', color: '#555' }}>{t.feedbackThanks}</Typography>
            ) : (
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder={t.feedbackPlaceholder}
                rows={5}
                style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontFamily: 'inherit', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setFeedbackDialogOpen(false)} sx={{ color: '#666' }}>{t.close}</Button>
            {!feedbackSubmitted && (
              <Button
                onClick={async () => {
                  if (!feedbackText.trim()) return
                  await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ feedback_text: feedbackText }),
                  })
                  setFeedbackSubmitted(true)
                }}
                variant="contained"
                sx={{ bgcolor: '#333' }}
                disabled={!feedbackText.trim()}
              >
                {t.feedbackSubmit}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Contact Dialog */}
        <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 600 }}>{t.contactTitle}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#555' }}>
              {t.contactBody}
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, mt: 2, color: '#333' }}>
              newsgap@pm.me
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setContactDialogOpen(false)} variant="contained" sx={{ bgcolor: '#333' }}>
              {t.close}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  )
}
