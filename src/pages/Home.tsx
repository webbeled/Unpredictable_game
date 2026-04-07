import { Box, Button, Typography, Paper, Card, Skeleton, Container } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/NavBar'
import anrLogo from '../assets/logos/ANR-cop.png'
import culturelabLogo from '../assets/logos/CultureLab-Blanc.webp'
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
  const [displayText, setDisplayText] = useState<Array<string | AnimatedTextPart>>([])
  const [isTyping, setIsTyping] = useState(true)

  const maskedArticle: AnimatedTextPart[] = [
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
  ]

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
  }, [isTyping])

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
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '11px',
          letterSpacing: '1.5px',
          color: '#666',
          mb: 1.5,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        Attention Clever Readers
      </Typography>
      <Box
        sx={{
          fontFamily: 'Georgia, serif',
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

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', maxWidth: 700, mt: 4 }}>
        <Skeleton variant="rounded" height={220} />
      </Box>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', mt: 3, color: '#666' }}>
        No games yet — play your first quiz to see your stats!
      </Typography>
    )
  }

  const best = Math.max(...sessions.map((s) => s.score))
  const total = sessions.length
  const average = Math.round((sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) * 10) / 10

  // Compute a running rating like chess.com Elo:
  // Start at 300, move toward each score with a K-factor that shrinks as you play more
  const POSColors: Record<string, string> = {
    '1111': '#FF6B6B', // Adjectives - red
    '2222': '#4ECDC4', // Closed class/Function words - teal
    '3333': '#4CAF50', // Nouns - green
    '4444': '#FFE66D', // Numbers - yellow
    '5555': '#C7CEEA', // Proper nouns - lavender
    '6666': '#A78BFA', // Verbs - purple
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

    // Create colored blocks for each correct guess
    const blocks: { color: string }[] = []
    const correctGuesses = (s as any).correct_guesses || []
    
    if (Array.isArray(correctGuesses) && correctGuesses.length > 0) {
      correctGuesses.forEach((guess: { part_of_speech: string }) => {
        const pos = guess.part_of_speech || ''
        const color = POSColors[pos] || '#999'
        blocks.push({ color })
      })
    }

    // If no correct guesses, show gray block for zero score
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
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
        <Card
          sx={{
            px: 2.5,
            py: 2.5,
            borderRadius: 0,
            background: '#fff',
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
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '28px', fontWeight: 'bold', color: '#000', letterSpacing: '-1px' }}>
            {total}
          </Typography>
          <Box sx={{ height: '1px', background: '#000', my: 1.2, mx: 0 }} />
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '9px', color: '#333', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 500 }}>
            Games
          </Typography>
        </Card>
        <Card
          sx={{
            px: 2.5,
            py: 2.5,
            borderRadius: 0,
            background: '#fff',
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
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '28px', fontWeight: 'bold', color: '#000', letterSpacing: '-1px' }}>
            {best}
          </Typography>
          <Box sx={{ height: '1px', background: '#000', my: 1.2, mx: 0 }} />
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '9px', color: '#333', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 500 }}>
            Best
          </Typography>
        </Card>
        <Card
          sx={{
            px: 2.5,
            py: 2.5,
            borderRadius: 0,
            background: '#fff',
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
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '28px', fontWeight: 'bold', color: '#000', letterSpacing: '-1px' }}>
            {average}
          </Typography>
          <Box sx={{ height: '1px', background: '#000', my: 1.2, mx: 0 }} />
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '9px', color: '#333', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 500 }}>
            Average
          </Typography>
        </Card>
        <Card
          sx={{
            px: 2.5,
            py: 2.5,
            borderRadius: 0,
            background: '#000',
            border: '2px solid #000',
            boxShadow: 'none',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            '&:hover': { 
              boxShadow: '2px 2px 8px rgba(0,0,0,0.25)',
              transform: 'translate(-1px, -1px)',
            },
          }}
        >
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '28px', fontWeight: 'bold', color: '#fff', letterSpacing: '-1px' }}>
            {sessions[sessions.length - 1].score}
          </Typography>
          <Box sx={{ height: '1px', background: '#fff', my: 1.2, mx: 0 }} />
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '9px', color: '#e0e0e0', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 500 }}>
            Latest
          </Typography>
        </Card>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 0,
          border: '2px solid #000',
          background: '#fafafa',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '13px',
            color: '#333',
            mb: 2.5,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Your Progression
        </Typography>
        <ResponsiveContainer width="100%" height={total > 20 ? 320 : 220}>
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -12, bottom: 10 }}
          >
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
            <YAxis
              tick={{ fontSize: 8, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 600]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 0,
                border: '1px solid #000',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                fontSize: 12,
                backgroundColor: '#fff',
                padding: '10px 12px',
              }}
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

function OrnamentalRule() {
  const motifs = Array.from({ length: 14 }, (_, index) => index)
  const segmentWidth = 80
  const viewBoxWidth = motifs.length * segmentWidth

  return (
    <Box
      aria-hidden="true"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        mb: 2.5,
        overflow: 'hidden',
      }}
    >
      <Box
        component="svg"
        viewBox={`0 0 ${viewBoxWidth} 16`}
        preserveAspectRatio="none"
        sx={{
          width: '100%',
          maxWidth: '860px',
          height: { xs: 10, sm: 12 },
          overflow: 'visible',
        }}
      >
        {motifs.map((index) => {
          const x = index * segmentWidth

          return (
            <g
              key={index}
              transform={`translate(${x}, 0)`}
              fill="none"
              stroke="#000"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M0 8 C6 2.2, 14 2.2, 20 8 C26 13.8, 34 13.8, 40 8 C46 2.2, 54 2.2, 60 8 C66 13.8, 74 13.8, 80 8"
                strokeWidth="1.2"
              />
              <path
                d="M24 8 C27.5 5.4, 30.5 5.4, 34 8 C37.5 10.6, 40.5 10.6, 44 8"
                strokeWidth="0.9"
              />
              <path
                d="M10 8 C12 5.2, 15 4.2, 18 4.8 C16 6.3, 15 8.1, 15.4 10.6"
                strokeWidth="0.75"
              />
              <path
                d="M10 8 C12 10.8, 15 11.8, 18 11.2 C16 9.7, 15 7.9, 15.4 5.4"
                strokeWidth="0.75"
              />
              <circle cx="20" cy="8" r="1.15" fill="#000" stroke="none" />
              <path
                d="M28 8 C29.2 5.8, 31.2 4.8, 33.5 5.2 C32.4 6.7, 32 8, 32.4 10"
                strokeWidth="0.7"
              />
              <path
                d="M28 8 C29.2 10.2, 31.2 11.2, 33.5 10.8 C32.4 9.3, 32 8, 32.4 6"
                strokeWidth="0.7"
              />
              <polygon points="38,8 42,4 46,8 42,12" fill="#000" stroke="none" />
              <path d="M38 8 C40 6.1, 42 5.2, 44 8 C42 10.8, 40 9.9, 38 8" strokeWidth="0.65" />
              <path d="M46 8 C44 6.1, 42 5.2, 40 8 C42 10.8, 44 9.9, 46 8" strokeWidth="0.65" />
              <path
                d="M50 8 C52.4 5.1, 55.4 4.4, 58.5 5 C57 6.8, 56.3 8.3, 56.8 10.6"
                strokeWidth="0.75"
              />
              <path
                d="M50 8 C52.4 10.9, 55.4 11.6, 58.5 11 C57 9.2, 56.3 7.7, 56.8 5.4"
                strokeWidth="0.75"
              />
              <circle cx="60" cy="8" r="1.15" fill="#000" stroke="none" />
              <path
                d="M62 8 C64.3 6.1, 66.5 5.2, 69 5.8 C67.7 7.2, 67.2 8.5, 67.6 10.3"
                strokeWidth="0.7"
              />
              <path
                d="M62 8 C64.3 9.9, 66.5 10.8, 69 10.2 C67.7 8.8, 67.2 7.5, 67.6 5.7"
                strokeWidth="0.7"
              />
            </g>
          )
        })}
      </Box>
    </Box>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <>
      <NavBar />
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          py: 4,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            mb: 4,
            alignItems: 'center',
            maxWidth: '900px',
            width: '100%',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <OrnamentalRule />

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
              THE DAILY
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Didot, Georgia, serif',
                fontSize: '64px',
                fontWeight: 'bold',
                fontStyle: 'italic',
                letterSpacing: '1.5px',
                mb: 0.5,
              }}
            >
              NewsGap
            </Typography>

            <OrnamentalRule />

            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate('/quiz')}
              sx={{
                fontFamily: 'Didot, Georgia, serif',
                fontSize: '18px',
                fontWeight: 'bold',
                px: 8,
                py: 2.5,
                backgroundColor: '#000',
                color: '#fff',
                border: '2px solid #000',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                '&:hover': {
                  backgroundColor: '#fff',
                  color: '#000',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Quiz
            </Button>
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

        {/* Footer with logos */}
        <Box
          sx={{
            mt: 'auto',
            pt: 8,
            pb: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            opacity: 0.55,
            transition: 'opacity 0.3s ease',
            '&:hover': {
              opacity: 0.75,
            },
          }}
        >
          <img
            src={anrLogo}
            alt="ANR"
            style={{
              height: 32,
              width: 'auto',
            }}
          />
          <Box sx={{ width: 1, height: 20, borderLeft: '1px solid #999', opacity: 0.3 }} />
          <img
            src={culturelabLogo}
            alt="CultureLab"
            style={{
              height: 32,
              width: 'auto',
              filter: 'drop-shadow(0px 0px 0.8px #000)',
              paintOrder: 'stroke',
              stroke: '#000',
              strokeWidth: '0.5px',
            }}
          />
        </Box>
      </Box>
    </>
  )
}
