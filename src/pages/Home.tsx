import { Box, Button, Typography, Paper, Card, Skeleton, Container } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/NavBar'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface QuizSession {
  quiz_id: string
  score: number
  created_at: number | string
  ended_at: number | string | null
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

function formatDate(ms: number | string) {
  return new Date(Number(ms)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Animated Newspaper Component
function AnimatedNewspaper() {
  const [displayText, setDisplayText] = useState<(string | { text: string; color: string })[]>([])
  const [isTyping, setIsTyping] = useState(true)

  // Color mapping for each word category (matching Game.tsx)
  const MASK_COLORS = {
    '1111': '#FF6B6B', // Adjectives - red
    '2222': '#4ECDC4', // Closed class - teal
    '3333': '#4CAF50', // Nouns - green
    '4444': '#FFE66D', // Numbers - yellow
    '5555': '#C7CEEA', // Proper nouns - lavender
    '6666': '#FFA07A', // Verbs - light salmon
  }

  // Article with color-coded blanks: {text, color}
  const maskedArticle = [
    { text: 'Certain', color: '' },
    { text: ' ' },
    { text: 'words', color: '' },
    { text: ' have been removed from this ', color: '' },
    { text: '_______', color: '#FF6B6B' }, // red blank
    { text: '. Can you ', color: '' },
    { text: '_____', color: '#4ECDC4' }, // teal blank
    { text: ' what they are? Use the color-coded hints and your ', color: '' },
    { text: '_________', color: '#4CAF50' }, // green blank
    { text: ' to fill in the blanks before time runs out. Every correct ', color: '' },
    { text: '______', color: '#FFE66D' }, // yellow blank
    { text: ' earns you ', color: '' },
    { text: '______', color: '#C7CEEA' }, // lavender blank
    { text: '. Good luck!', color: '' },
  ]

  useEffect(() => {
    if (!isTyping) return

    let charIndex = 0
    let displayIndex = 0
    const timer = setInterval(() => {
      let currentChar = 0
      let builtText: (string | { text: string; color: string })[] = []

      for (let i = 0; i < maskedArticle.length; i++) {
        const item = maskedArticle[i]
        const itemText = typeof item === 'string' ? item : item.text

        if (currentChar + itemText.length <= charIndex) {
          builtText.push(item)
          currentChar += itemText.length
        } else if (currentChar < charIndex) {
          const partial = itemText.substring(0, charIndex - currentChar)
          if (typeof item === 'string') {
            builtText.push(partial)
          } else {
            builtText.push({ text: partial, color: item.color })
          }
          break
        } else {
          break
        }
      }

      if (charIndex < maskedArticle.reduce((sum, item) => sum + (typeof item === 'string' ? item.length : item.text.length), 0)) {
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
          } else {
            return (
              <span
                key={idx}
                style={{
                  backgroundColor: item.color,
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontWeight: 'bold',
                }}
              >
                {item.text}
              </span>
            )
          }
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

  const avg = Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
  const best = Math.max(...sessions.map((s) => s.score))
  const total = sessions.length

  const chartData = sessions.map((s) => ({
    date: formatDate(s.created_at),
    score: s.score,
  }))

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stats Cards - Compact Horizontal Layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 4 }}>
        <Card
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 0,
            background: '#fff',
            border: '1px solid #ddd',
            boxShadow: 'none',
            textAlign: 'center',
            '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          }}
        >
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '22px', fontWeight: 'bold' }}>
            {total}
          </Typography>
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            Games
          </Typography>
        </Card>
        <Card
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 0,
            background: '#fff',
            border: '1px solid #ddd',
            boxShadow: 'none',
            textAlign: 'center',
            '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          }}
        >
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '22px', fontWeight: 'bold' }}>
            {best}
          </Typography>
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            Best
          </Typography>
        </Card>
        <Card
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 0,
            background: '#fff',
            border: '1px solid #ddd',
            boxShadow: 'none',
            textAlign: 'center',
            '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          }}
        >
          <Typography sx={{ fontFamily: 'Didot, Georgia, serif', fontSize: '22px', fontWeight: 'bold' }}>
            {sessions[sessions.length - 1].score}
          </Typography>
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            Latest
          </Typography>
        </Card>
      </Box>

      {/* Chart - Compact */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          border: '1px solid #ddd',
          background: '#fff',
          boxShadow: 'none',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '12px',
            color: '#666',
            mb: 1.5,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Score Trend
        </Typography>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={chartData} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#888' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: '#888' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 0,
                border: '1px solid #ddd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: 11,
              }}
              cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#000"
              strokeWidth={2}
              fill="url(#scoreGrad)"
              dot={{ r: 2, fill: '#000', strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
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
        {/* Two Column Layout - Animation + Main Content */}
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
          {/* Left - Main Hero Section */}
          <Box sx={{ textAlign: 'center' }}>
            {/* Ornamental rule - top */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              mb: 2.5,
              fontSize: '7px',
              color: '#000',
              letterSpacing: '-3px',
            }}>
              ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼
            </Box>


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

            {/* Ornamental rule - bottom */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              mb: 2.5,
              fontSize: '7px',
              color: '#000',
              letterSpacing: '-3px',
            }}>
              ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼ ◆ ∿ ❖ ∿ ◆ ∼
            </Box>

            {/* Call to Action - Bigger Button */}
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

          {/* Right - Animated Newspaper */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <AnimatedNewspaper />
          </Box>
        </Box>

        {/* Stats Section - Full Width Below */}
        {user && (
          <Container maxWidth="md">
            <StatsSection />
          </Container>
        )}
      </Box>
    </>
  )
}
