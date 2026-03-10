import { Box, Button, Typography, Paper, Chip, Skeleton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/NavBar'
import { useQuery } from '@tanstack/react-query'
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
  created_at: number
  ended_at: number | null
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

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 3,
        py: 2,
        borderRadius: 3,
        background: 'rgba(25, 118, 210, 0.06)',
        border: '1px solid rgba(25, 118, 210, 0.15)',
        textAlign: 'center',
        minWidth: 110,
      }}
    >
      <Typography variant="h5" fontWeight={700} color="primary">
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Typography>
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
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
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
    <Box sx={{ width: '100%', maxWidth: 700, mt: 5 }}>
      {/* Average score hero */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Chip
          label="Your Stats"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mb: 1, letterSpacing: 1, fontSize: 11 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1 }}>
          <Typography variant="h2" fontWeight={800} color="primary" lineHeight={1}>
            {avg}
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            avg score
          </Typography>
        </Box>
      </Box>

      {/* Stat cards row */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4, flexWrap: 'wrap' }}>
        <StatCard label="Games" value={total} />
        <StatCard label="Best" value={best} />
        <StatCard label="Latest" value={sessions[sessions.length - 1].score} />
      </Box>

      {/* Area chart */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, letterSpacing: 0.5 }}>
          Score over time
        </Typography>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#888' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                fontSize: 13,
              }}
              cursor={{ stroke: '#1976d2', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#1976d2"
              strokeWidth={2.5}
              fill="url(#scoreGrad)"
              dot={{ r: 4, fill: '#1976d2', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
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
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="calc(100vh - 64px)"
      px={3}
      py={8}
      sx={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(25,118,210,0.08) 0%, transparent 70%)',
      }}
    >
      <Typography
        variant="h2"
        component="h1"
        fontWeight={800}
        letterSpacing={-1}
        sx={{ mb: 1, textAlign: 'center' }}
      >
        NewsGap
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Guess the hidden words in the news article!
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => navigate('/quiz')}
        sx={{ borderRadius: 3, px: 5, py: 1.5, fontSize: 16, fontWeight: 600, boxShadow: 3 }}
      >
        Go to Quiz
      </Button>

      {user && <StatsSection />}
    </Box>
    </>
  )
}
