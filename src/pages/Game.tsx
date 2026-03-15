import { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Container, Box, Typography, Button, Alert, CircularProgress, TextField, Chip, Stack, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import { useConfig } from '../contexts/ConfigContext'
import { useQuiz, useQuizAnswer, useGuessSubmit } from '../hooks/useQuiz'
import NavBar from '../components/NavBar'

// Color mapping for each word category
const MASK_COLORS = {
  '1111': '#FF6B6B', // Adjectives - red
  '2222': '#4ECDC4', // Closed class - teal
  '3333': '#4CAF50', // Nouns - green
  '4444': '#FFE66D', // Numbers - yellow
  '5555': '#C7CEEA', // Proper nouns - lavender
  '6666': '#FFA07A', // Verbs - light salmon
}

const MASK_LABELS: Record<string, string> = {
  '1111': 'Adjectives',
  '2222': 'Closed Class',
  '3333': 'Nouns',
  '4444': 'Numbers',
  '5555': 'Proper Nouns',
  '6666': 'Verbs',
}

export default function Game() {
  const { config } = useConfig()
  const queryClient = useQueryClient()

  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<Map<string, Set<string>>>(new Map())
  const [guessError, setGuessError] = useState<string | null>(null)
  const [revealedMasks, setRevealedMasks] = useState<Map<string, string>>(new Map()) // mask -> word mapping
  const [score, setScore] = useState(0)
  const [selectedMask, setSelectedMask] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(config.timerDuration)
  const [isRevealed, setIsRevealed] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [answerData, setAnswerData] = useState<any>(null)

  const { data: randomEntry, isLoading, error, refetch } = useQuiz()

  const presentMasks = useMemo(() => {
    if (!randomEntry?.annotate) return new Set<string>()
    return new Set(randomEntry.annotate.match(/1111|2222|3333|4444|5555|6666/g) ?? [])
  }, [randomEntry?.annotate])
  const { refetch: fetchAnswer } = useQuizAnswer(randomEntry?.id || '')
  const { mutateAsync: submitGuess } = useGuessSubmit(randomEntry?.id || '')

  const quizStartedAt = useRef<number>(0)
  const sessionSaved = useRef(false)
  const answerInputRef = useRef<HTMLInputElement>(null)
  const answerFetchedRef = useRef(false)

  // Record start time whenever a new quiz loads
  useEffect(() => {
    if (randomEntry?.id) {
      quizStartedAt.current = Date.now()
      sessionSaved.current = false
    }
  }, [randomEntry?.id])

  // Mutable ref so the effect below never goes stale but also never re-fires
  // just because guesses/score changed — only fires when isRevealed flips.
  const saveQuizSessionRef = useRef<(endedAt: number) => void>(() => {})
  saveQuizSessionRef.current = (endedAt: number) => {
    if (sessionSaved.current || !randomEntry?.id) return
    sessionSaved.current = true

    const guessedWords = Array.from(guesses.entries()).flatMap(([partOfSpeech, words]) =>
      Array.from(words).map((word) => ({ word, part_of_speech: partOfSpeech }))
    )

    fetch('/api/quiz-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        quiz_id: randomEntry.id,
        score,
        guessed_words: guessedWords,
        ended_at: endedAt,
        created_at: quizStartedAt.current,
      }),
    })
      .then(() => {
        // Invalidate the quiz-sessions cache so the home page shows updated stats
        queryClient.invalidateQueries({ queryKey: ['quiz-sessions'] })
      })
      .catch((err) => console.error('Failed to save quiz session:', err))
  }

  // Save session whenever the quiz ends (time up or all words guessed)
  useEffect(() => {
    if (isRevealed) {
      saveQuizSessionRef.current(Date.now())
    }
  }, [isRevealed])

  // Fetch answer and reveal all masks when quiz ends
  useEffect(() => {
    if (isRevealed && randomEntry?.id && !answerData && !answerFetchedRef.current) {
      answerFetchedRef.current = true
      const revealAllAnswers = async () => {
        try {
          console.log('Fetching answer for quiz:', randomEntry.id)
          const result = await fetchAnswer()
          console.log('Answer fetch result:', result)
          
          if (result?.data) {
            try {
              console.log('Setting answer data:', result.data)
              setAnswerData(result.data)
              // Reveal all masks - only add if they have values
              const allMasks = new Map<string, string>()
              const masks = [
                { key: '1111', value: result.data.solution_adj },
                { key: '2222', value: result.data.solution_closed_class },
                { key: '3333', value: result.data.solution_nouns },
                { key: '4444', value: result.data.solution_numbers },
                { key: '5555', value: result.data.solution_proper_nouns },
                { key: '6666', value: result.data.solution_verbs },
              ]
              
              masks.forEach(({ key, value }) => {
                if (value !== null && value !== undefined && value !== '') {
                  allMasks.set(key, String(value))
                }
              })
              
              console.log('Revealed masks:', Object.fromEntries(allMasks))
              setRevealedMasks(allMasks)
            } catch (err) {
              console.error('Error processing answer data:', err, 'Data was:', result.data)
              setAnswerData(result.data) // Set data anyway, even if reveal failed
            }
          } else {
            console.error('No data in answer fetch result:', result)
          }
        } catch (err) {
          console.error('Failed to fetch answer:', err)
        }
      }
      
      revealAllAnswers()
    }
  }, [isRevealed, randomEntry?.id, answerData])

  const handleNewGame = () => {
    try {
      saveQuizSessionRef.current(Date.now())
      refetch()
      setGuesses(new Map())
      setGuess('')
      setRevealedMasks(new Map())
      setTimeRemaining(config.timerDuration)
      setIsRevealed(false)
      setSuccessMessage(null)
      setAnswerData(null)
      setScore(0)
      setSelectedMask(null)
      answerFetchedRef.current = false
    } catch (err) {
      console.error('Error starting new game:', err)
      window.location.reload()
    }
  }

  useEffect(() => {
    if (isRevealed) return

    if (timeRemaining <= 0) {
      setIsRevealed(true)
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          clearInterval(timer)
          setIsRevealed(true)
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRevealed])

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

    if (!selectedMask) {
      setGuessError('Select a part of speech first')
      return
    }

    if (guesses.get(selectedMask)?.has(trimmedGuess)) {
      setGuessError(`You already guessed "${trimmedGuess}" for ${MASK_LABELS[selectedMask]}`)
      return
    }

    try {
      const result = await submitGuess(trimmedGuess)

      const newGuesses = new Map(guesses)
      if (!newGuesses.has(selectedMask)) newGuesses.set(selectedMask, new Set())
      newGuesses.get(selectedMask)!.add(trimmedGuess)
      setGuesses(newGuesses)
      setGuess('')
      setGuessError(null)

      if (result.correct && result.mask && result.word) {
        // Award 100 points for correct guess
        setScore((prev) => prev + 100)

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

    // Track how many of each mask type we've seen for multi-word solutions
    const maskCounts: Record<string, number> = {}

    return parts.map((part, index) => {
      // Check if this part is a mask number
      if (part in MASK_COLORS) {
        const maskColor = MASK_COLORS[part as keyof typeof MASK_COLORS]
        
        // Track occurrence of this mask
        if (!maskCounts[part]) {
          maskCounts[part] = 0
        }
        const occurrenceIndex = maskCounts[part]
        maskCounts[part]++

        const revealedSolution = revealedMasks.get(part)
        // Split multi-word solutions and get the word at this occurrence
        const revealedWord = revealedSolution
          ? revealedSolution.split(/\s+/)[occurrenceIndex]
          : undefined

        // If game is won (successMessage exists), show green background
        const backgroundColor = successMessage && revealedWord ? '#4caf50' : maskColor
        const isBoxRevealed = !!revealedWord
        const isBoxSelected = selectedMask === part

        return (
          <Box
            key={index}
            component="span"
            onClick={isBoxRevealed ? undefined : () => {
              setSelectedMask(part)
              answerInputRef.current?.focus()
            }}
            sx={{
              backgroundColor,
              color: revealedWord ? 'white' : backgroundColor,
              padding: '1px 4px',
              borderRadius: '2px',
              fontWeight: 'bold',
              mx: 0.25,
              display: 'inline-block',
              minWidth: '40px',
              cursor: isBoxRevealed ? 'default' : 'pointer',
              outline: isBoxSelected && !isBoxRevealed ? '2px solid #333' : 'none',
              outlineOffset: '2px',
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
      <NavBar score={score} />
      <Box sx={{ background: '#fafafa', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
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
            <Box
              sx={{
                background: '#ffffff',
                border: '1px solid #dddddd',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                p: { xs: 3, md: 4 },
              }}
            >
              {/* Newspaper masthead */}
              <Box sx={{ textAlign: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid #000000' }}>
                {/* Center - Title */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      letterSpacing: '0.15em',
                      color: '#000000',
                      mb: 0.05,
                      fontStyle: 'italic',
                    }}
                  >
                    THE DAILY
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Didot", "Playfair Display", Georgia, serif',
                      fontSize: '2.8rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      color: '#000000',
                      lineHeight: 1,
                      fontStyle: 'italic',
                      mb: 0.5,
                    }}
                  >
                    NewsGap
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      fontSize: '1.32rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: timeRemaining <= 10 ? '#d32f2f' : '#666666',
                      textTransform: 'uppercase',
                    }}
                  >
                    {formatTime(timeRemaining)}
                  </Typography>
                </Box>

                {/* Right - Score */}
                <Box sx={{ width: 80, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                  {score !== undefined && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          letterSpacing: '0.1em',
                          color: '#666666',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Score
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '1.4rem',
                          fontWeight: 900,
                          color: '#000000',
                          fontFamily: 'monospace',
                        }}
                      >
                        {score}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Timer and controls - now only button */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleNewGame}
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    '&:hover': {
                      backgroundColor: '#000000',
                      color: '#ffffff',
                    },
                  }}
                >
                  {!isRevealed ? "Skip" : "Next"}
                </Button>
              </Box>

              {/* Article text */}
              <Box sx={{ my: 4 }}>
                <Typography
                  sx={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.1rem',
                    lineHeight: 1.8,
                    color: '#000000',
                    textAlign: 'justify',
                  }}
                >
                  {renderMaskedText()}
                </Typography>
              </Box>

              {successMessage && (
                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    border: '1px solid #2e7d32',
                  }}
                >
                  {successMessage}
                </Alert>
              )}

              {isRevealed && timeRemaining === 0 && !successMessage && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    backgroundColor: '#e3f2fd',
                    color: '#0d47a1',
                    border: '1px solid #0d47a1',
                  }}
                >
                  Time's up! Review the article above and move to the next challenge.
                </Alert>
              )}

              {/* Guess form */}
              <Box component="form" onSubmit={handleGuessSubmit} sx={{ my: 4, borderTop: '1px solid #cccccc', pt: 3 }}>
                <FormControl component="fieldset" sx={{ mb: 2, display: 'block' }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      fontSize: '0.85rem',
                      mb: 1.5,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: '#000000',
                      textTransform: 'uppercase',
                    }}
                  >
                    What word type are you guessing?
                  </FormLabel>
                  <RadioGroup
                    row
                    value={selectedMask ?? ''}
                    onChange={(e) => setSelectedMask(e.target.value)}
                    sx={{ gap: 2 }}
                  >
                    {Object.keys(MASK_LABELS)
                      .filter((code) => presentMasks.has(code))
                      .map((code) => (
                        <FormControlLabel
                          key={code}
                          value={code}
                          disabled={revealedMasks.has(code) || isRevealed}
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: '#CCCCCC',
                                '&.Mui-checked': { color: MASK_COLORS[code as keyof typeof MASK_COLORS] },
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: MASK_COLORS[code as keyof typeof MASK_COLORS] }}>
                              {MASK_LABELS[code]}
                            </Typography>
                          }
                        />
                      ))}
                  </RadioGroup>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your guess..."
                    value={guess}
                    onChange={handleGuessChange}
                    error={!!guessError}
                    helperText={guessError}
                    disabled={isRevealed}
                    inputRef={answerInputRef}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Georgia, serif',
                        fontSize: '1rem',
                        '& fieldset': {
                          borderColor: '#cccccc',
                        },
                        '&:hover fieldset': {
                          borderColor: '#000000',
                        },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isRevealed}
                    sx={{
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      minWidth: 110,
                      '&:hover': {
                        backgroundColor: '#333333',
                      },
                      '&:disabled': {
                        backgroundColor: '#cccccc',
                        color: '#666666',
                      },
                    }}
                  >
                    Guess
                  </Button>
                </Box>
              </Box>

              {/* Guesses summary */}
              {guesses.size > 0 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #cccccc' }}>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: '#666666',
                      mb: 2,
                    }}
                  >
                    Your Answers ({Array.from(guesses.values()).reduce((n, s) => n + s.size, 0)})
                  </Typography>
                  <Stack spacing={1.5}>
                    {Object.keys(MASK_LABELS)
                      .filter((code) => guesses.get(code)?.size)
                      .map((code) => (
                        <Box key={code} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: '#000000',
                              minWidth: 100,
                            }}
                          >
                            {MASK_LABELS[code]}
                          </Typography>
                          {Array.from(guesses.get(code)!).map((word) => (
                            <Chip
                              key={word}
                              label={word}
                              size="small"
                              sx={{
                                backgroundColor: '#f0f0f0',
                                fontFamily: 'Georgia, serif',
                                fontWeight: 500,
                              }}
                            />
                          ))}
                        </Box>
                      ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </>
  )
}
