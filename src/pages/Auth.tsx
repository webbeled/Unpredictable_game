import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const [tab, setTab] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 0) {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate('/quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box mt={8} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Typography variant="h5" fontWeight="bold">
          Unpredictable
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError('') }} variant="fullWidth">
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
        </Box>
        <Box component="form" onSubmit={handleSubmit} width="100%" display="flex" flexDirection="column" gap={2}>
          {error && (
            <Alert severity="error">
              {error === 'No account found with this email' ? (
                <>
                  <AlertTitle>No account found</AlertTitle>
                  No account exists for this email.{' '}
                  <Button
                    size="small"
                    sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', textTransform: 'none' }}
                    onClick={() => { setTab(1); setError('') }}
                  >
                    Register instead?
                  </Button>
                </>
              ) : error}
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete={tab === 0 ? 'current-password' : 'new-password'}
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {tab === 0 ? 'Login' : 'Register'}
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
