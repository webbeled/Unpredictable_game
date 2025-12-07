import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Button, AppBar, Toolbar, Alert, CircularProgress, TextField, Chip, Stack, IconButton } from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import SettingsIcon from '@mui/icons-material/Settings'
import { useConfig } from '../contexts/ConfigContext'
import { useQuiz, useQuizAnswer, useGuessSubmit } from '../hooks/useQuiz'

export default function Game() {
  const navigate = useNavigate()
  const { config } = useConfig()

  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<Set<string>>(new Set())
  const [guessError, setGuessError] = useState<string | null>(null)

  const [timeRemaining, setTimeRemaining] = useState(config.timerDuration)
  const [isRevealed, setIsRevealed] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [solution, setSolution] = useState<string | null>(null)

  const [currentGuess, setCurrentGuess] = useState('')

  const { data: randomEntry, isLoading, error, refetch } = useQuiz()
  const { refetch: fetchAnswer } = useQuizAnswer(randomEntry?.id || '')
  const { data: guessResult, refetch: submitGuessQuery } = useGuessSubmit(randomEntry?.id || '', currentGuess)

  // Fetch answer when time runs out (not when correct guess is made)
  useEffect(() => {
    if (isRevealed && randomEntry?.id && !solution && timeRemaining === 0) {
      fetchAnswer().then((result) => {
        if (result.data) {
          setSolution(result.data.solution)
        }
      }).catch((err) => {
        console.error('Failed to fetch answer:', err)
      })
    }
  }, [isRevealed, randomEntry?.id, solution, timeRemaining, fetchAnswer])

  const handleNewGame = () => {
    refetch()
    setGuesses(new Set())
    setGuess('')
    setTimeRemaining(config.timerDuration)
    setIsRevealed(false)
    setSuccessMessage(null)
    setSolution(null)
  }

  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsRevealed(true)
      return
    }

    if (isRevealed) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsRevealed(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, isRevealed])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedGuess = guess.toLowerCase().trim()

    if (!trimmedGuess || isRevealed || !randomEntry?.id) {
      return
    }

    if (guesses.has(trimmedGuess)) {
      setGuessError(`You already guessed "${trimmedGuess}"`)
      return
    }

    try {
      setCurrentGuess(trimmedGuess)
      const result = await submitGuessQuery()

      setGuesses(new Set([...guesses, trimmedGuess]))
      setGuess('')
      setGuessError(null)

      if (result.data?.correct && result.data?.solution) {
        setIsRevealed(true)
        setSolution(result.data.solution)
        setSuccessMessage(`Congratulations! You guessed the correct word: "${result.data.solution}"`)
      }
    } catch (err) {
      setGuessError(err instanceof Error ? err.message : 'Failed to submit guess')
    }
  }

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value)
    setGuessError(null)
  }

  const maskText = (text: string): string => {
    if (!text) return ''

    const parts = text.split(/(\s+|[.,;:!?()[\]{}'"«»])/g)

    return parts.map(part => {
      if (part === 'XXXX') {
        return '▓▓▓▓'
      }
      const lowerPart = part.toLowerCase()
      if (guesses.has(lowerPart)) {
        return part
      }
      return part
    }).join('')
  }

  const renderRevealedText = () => {
    if (!randomEntry || !solution) return null

    const text = randomEntry.annotate

    const parts = text.split('XXXX')
    const highlightColor = successMessage ? '#4caf50' : '#f44336'

    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <Box
            component="span"
            sx={{
              backgroundColor: highlightColor,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 'bold',
              mx: 0.5
            }}
          >
            {solution}
          </Box>
        )}
      </span>
    ))
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <ArticleIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Redactle-v2
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'left' }}>
          {isLoading && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Loading...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error.message}
            </Alert>
          )}

          {!isLoading && randomEntry && (
            <Box sx={{ mt: 4 }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }} />
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: timeRemaining <= 10 ? 'error.main' : 'primary.main',
                    fontFamily: 'monospace',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  {formatTime(timeRemaining)}
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color={!isRevealed ? "secondary" : "primary"}
                    onClick={handleNewGame}
                  >
                    {!isRevealed ? "Skip to next quiz" : "Next Quiz"}
                  </Button>
                </Box>
              </Box>

              {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {successMessage}
                </Alert>
              )}

              {isRevealed && timeRemaining === 0 && !successMessage && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Time's up! The correct word was: "{solution || 'Unknown'}"
                </Alert>
              )}

              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ lineHeight: 1.6 }}
              >
                {isRevealed ? renderRevealedText() : maskText(randomEntry.annotate)}
              </Typography>

              <Box component="form" onSubmit={handleGuessSubmit} sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Make a guess"
                    value={guess}
                    onChange={handleGuessChange}
                    placeholder="Enter a word..."
                    error={!!guessError}
                    helperText={guessError}
                    disabled={isRevealed}
                  />
                  <Button type="submit" variant="contained" sx={{ minWidth: 100 }} disabled={isRevealed}>
                    Guess
                  </Button>
                </Box>
              </Box>

              {guesses.size > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Your guesses ({guesses.size}):
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {Array.from(guesses).map((word) => (
                      <Chip key={word} label={word} size="medium" />
                    ))}
                  </Stack>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                Source: {randomEntry.fileName} - {randomEntry.sheetName}
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </>
  )
}
