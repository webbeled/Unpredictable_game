import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Button, AppBar, Toolbar, Alert, CircularProgress, TextField, Chip, Stack, IconButton } from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import SettingsIcon from '@mui/icons-material/Settings'
import { useConfig } from '../contexts/ConfigContext'
import { useQuiz, useQuizAnswer, useGuessSubmit } from '../hooks/useQuiz'

// Color mapping for each word category
const MASK_COLORS = {
  '1111': '#FF6B6B', // Adjectives - red
  '2222': '#4ECDC4', // Closed class - teal
  '3333': '#4CAF50', // Nouns - green
  '4444': '#FFE66D', // Numbers - yellow
  '5555': '#C7CEEA', // Proper nouns - lavender
  '6666': '#FFA07A', // Verbs - light salmon
}

export default function Game() {
  const navigate = useNavigate()
  const { config } = useConfig()

  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<Set<string>>(new Set())
  const [guessError, setGuessError] = useState<string | null>(null)
  const [revealedMasks, setRevealedMasks] = useState<Map<string, string>>(new Map()) // mask -> word mapping

  const [timeRemaining, setTimeRemaining] = useState(config.timerDuration)
  const [isRevealed, setIsRevealed] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [answerData, setAnswerData] = useState<any>(null)

  const { data: randomEntry, isLoading, error, refetch } = useQuiz()
  const { refetch: fetchAnswer } = useQuizAnswer(randomEntry?.id || '')
  const { mutateAsync: submitGuess } = useGuessSubmit(randomEntry?.id || '')

  // Fetch answer and reveal all masks when time runs out
  useEffect(() => {
    if (isRevealed && randomEntry?.id && !answerData && timeRemaining === 0) {
      fetchAnswer().then((result) => {
        if (result.data) {
          setAnswerData(result.data)
          // Reveal all masks
          const allMasks = new Map<string, string>()
          allMasks.set('1111', result.data.solution_adj || '')
          allMasks.set('2222', result.data.solution_closed_class || '')
          allMasks.set('3333', result.data.solution_nouns || '')
          allMasks.set('4444', result.data.solution_numbers || '')
          allMasks.set('5555', result.data.solution_proper_nouns || '')
          allMasks.set('6666', result.data.solution_verbs || '')
          setRevealedMasks(allMasks)
        }
      }).catch((err) => {
        console.error('Failed to fetch answer:', err)
      })
    }
  }, [isRevealed, randomEntry?.id, answerData, timeRemaining, fetchAnswer])

  const handleNewGame = () => {
    refetch()
    setGuesses(new Set())
    setGuess('')
    setRevealedMasks(new Map())
    setTimeRemaining(config.timerDuration)
    setIsRevealed(false)
    setSuccessMessage(null)
    setAnswerData(null)
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
      const result = await submitGuess(trimmedGuess)

      setGuesses(new Set([...guesses, trimmedGuess]))
      setGuess('')
      setGuessError(null)

      if (result.correct && result.mask && result.word) {
        // Add the revealed mask
        const newRevealedMasks = new Map(revealedMasks)
        newRevealedMasks.set(result.mask, result.word)
        setRevealedMasks(newRevealedMasks)

        // Count total masks in the paragraph
        const totalMasks = (randomEntry.annotate.match(/1111|2222|3333|4444|5555|6666/g) || []).length

        // Check if all masks are revealed
        if (newRevealedMasks.size >= totalMasks) {
          setIsRevealed(true)
          setSuccessMessage(`Congratulations! You guessed all the words!`)
          // Fetch the full answer data
          fetchAnswer().then((answerResult) => {
            if (answerResult.data) {
              setAnswerData(answerResult.data)
            }
          }).catch((err) => {
            console.error('Failed to fetch full answer:', err)
          })
        }
      }
    } catch (err) {
      setGuessError(err instanceof Error ? err.message : 'Failed to submit guess')
    }
  }

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value)
    setGuessError(null)
  }

  const renderMaskedText = () => {
    if (!randomEntry?.annotate) return null

    const text = randomEntry.annotate
    // Split by the mask numbers while keeping them in the result
    const parts = text.split(/(1111|2222|3333|4444|5555|6666)/g)

    return parts.map((part, index) => {
      // Check if this part is a mask number
      if (part in MASK_COLORS) {
        const maskColor = MASK_COLORS[part as keyof typeof MASK_COLORS]
        const revealedWord = revealedMasks.get(part)
        // If game is won (successMessage exists), show green background
        const backgroundColor = successMessage && revealedWord ? '#4caf50' : maskColor

        return (
          <Box
            key={index}
            component="span"
            sx={{
              backgroundColor,
              color: revealedWord ? 'white' : backgroundColor,
              padding: '1px 4px',
              borderRadius: '2px',
              fontWeight: 'bold',
              mx: 0.25,
              display: 'inline-block',
              minWidth: '40px',
            }}
          >
            {revealedWord || '___'}
          </Box>
        )
      }
      return <span key={index}>{part}</span>
    })
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
                  Time's up! Move to the next quiz.
                </Alert>
              )}

              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                  Parts of Speech Legend:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: MASK_COLORS['1111'], borderRadius: 0.5 }} />
                    <Typography variant="body2">Adjectives</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: MASK_COLORS['2222'], borderRadius: 0.5 }} />
                    <Typography variant="body2">Closed Class</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: MASK_COLORS['3333'], borderRadius: 0.5 }} />
                    <Typography variant="body2">Nouns</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: MASK_COLORS['4444'], borderRadius: 0.5 }} />
                    <Typography variant="body2">Numbers</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: MASK_COLORS['5555'], borderRadius: 0.5 }} />
                    <Typography variant="body2">Proper Nouns</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: MASK_COLORS['6666'], borderRadius: 0.5 }} />
                    <Typography variant="body2">Verbs</Typography>
                  </Box>
                </Stack>
              </Box>

              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ lineHeight: 1.6 }}
              >
                {renderMaskedText()}
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
