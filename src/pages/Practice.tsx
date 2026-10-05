import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material'
import { useConfig } from '../contexts/ConfigContext'
import { useLang } from '../contexts/LangContext'
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

const MASK_LABELS_BY_LANG: Record<string, Record<string, string>> = {
  en: {
    '1111': 'Adjectives',
    '2222': 'Closed Class',
    '3333': 'Nouns',
    '4444': 'Numbers',
    '5555': 'Proper Nouns',
    '6666': 'Verbs',
  },
  fr: {
    '1111': 'Adjectifs',
    '2222': 'Mots outils',
    '3333': 'Noms',
    '4444': 'Nombres',
    '5555': 'Noms propres',
    '6666': 'Verbes',
  },
}

// Text and UI translations for the Practice page
const practiceTranslations = {
  en: {
    loading: 'Loading...',
    daily: 'THE DAILY',
    title: 'Practice',
    scoreLabel: 'Score',
    finalLabel: 'Final',
    giveUp: 'I Give Up',
    next: 'Next',

    timesUp:
      "Time's up! Review the article above and move to the next challenge.",

    wordTypeQuestion: 'What word type are you guessing?',
    placeholder: 'Enter your guess...',
    guessButton: 'Guess',
    yourAnswers: 'Your Answers',

    selectPosFirst: 'Select a part of speech first',

    alreadyGuessed: (word: string, pos: string) =>
      `You already guessed "${word}" for ${pos}`,

    congrats: 'Congratulations! You guessed all the words!',

    instruction:
      'This practice round works just like the game. You will see a short excerpt with several words removed. Your task is to guess the missing words.',

    scoreInstruction:
      'Each blank represents a different word type. Each correct answer earns you',

    points: 'points.',

    timerInstruction:
      'You have the same amount of time as a normal game article. If you want to move on early, click',

    moveOn: '"I Give Up."',

    timeUp:
      'When the time is up, all answers will be revealed in their blanks so you can review them.',

    ready:
      'When you are ready, click NEXT to begin your first newspaper article.',

    enjoy: 'Enjoy the game!',
  },

  fr: {
    loading: 'Chargement...',
    daily: 'LE QUOTIDIEN',
    title: 'Entraînement',
    scoreLabel: 'Score',
    finalLabel: 'Final',
    giveUp: "J'abandonne",
    next: 'Suivant',

    timesUp:
      "Temps écoulé ! Relisez l'article ci-dessus et passez au défi suivant.",

    wordTypeQuestion: 'Quel type de mot devinez-vous ?',
    placeholder: 'Entrez votre réponse...',
    guessButton: 'Deviner',
    yourAnswers: 'Vos réponses',

    selectPosFirst:
      "Sélectionnez d'abord une partie du discours",

    alreadyGuessed: (word: string, pos: string) =>
      `Vous avez déjà deviné « ${word} » pour ${pos}`,

    congrats:
      'Félicitations ! Vous avez deviné tous les mots !',

    instruction:
      "Cette séance d'entraînement fonctionne comme le jeu. Vous allez découvrir un court extrait contenant plusieurs mots supprimés. Votre tâche consiste à deviner les mots manquants.",

    scoreInstruction:
      'Chaque case représente un type de mot différent. Chaque bonne réponse vous rapporte',

    points: 'points.',

    timerInstruction:
      'Vous disposez du même temps que pour un article normal. Si vous souhaitez passer à la suite, cliquez sur',

    moveOn: '« J’abandonne ».',

    timeUp:
      'Lorsque le temps est écoulé, toutes les réponses seront révélées dans leurs cases afin que vous puissiez les revoir.',

    ready:
      'Lorsque vous êtes prêt, cliquez sur SUIVANT pour commencer votre premier article de journal.',

    enjoy: 'Bon jeu !',
  },
}

// Practice text.
// The numbers are the same mask codes used by Game.tsx.
const PRACTICE_TEXT_BY_LANG = {
  en:
    'How to play?\n\nIn 5555, you will see a short text from a real newspaper article with several words removed. Your task is to guess the missing words. Let’s start to try it now! Each blank represents a different word type, indicated by its color. Click a colored blank or a word type below to select your target. Then type your guess in the “Enter your guess…” bar below. If your guess is incorrect, it will appear at the end of the text, and you can keep guessing until you find the exact answer. Each correct answer earns you 4444 points. You can switch between blanks at any time. You have 3 minutes for each 3333 article. If you want 2222 move on, click “I give up.” When the time is up, all answers will be revealed in their 1111 blanks so you can review them. When you are ready, click NEXT to 6666 your first newspaper article.\n\nEnjoy the game!',

  fr:
    'Comment jouer?\n\nDans 5555, vous allez découvrir un court article d’un véritable article de journal dont plusieurs mots ont été supprimés. Votre tâche consiste à deviner les mots manquants. Commençons dès maintenant ! Chaque case vide représente un type de mot différent, indiqué par sa couleur. Cliquez sur une case colorée ou sur un type de mot ci-dessous pour sélectionner votre cible. Tapez ensuite votre réponse dans la barre « Entrez votre réponse… ». Si votre réponse est incorrecte, elle apparaîtra à la fin du texte et vous pourrez continuer à essayer jusqu’à trouver la bonne réponse. Chaque bonne réponse vous rapporte 4444 points. Vous pouvez changer de case à tout moment. Vous disposez de 3 minutes pour chaque 3333 article. Si vous souhaitez 2222 passer à l’article suivant, cliquez sur « J’abandonne ». Lorsque le temps est écoulé, toutes les réponses seront révélées dans leurs cases 1111 afin que vous puissiez les revoir. Lorsque vous êtes prêt, cliquez sur SUIVANT pour 6666 votre premier article de journal.\n\nBon jeu !',
}

// Correct answers for the practice masks.
// Unlike Game.tsx, these answers are defined locally.
const PRACTICE_ANSWERS_BY_LANG: Record<
  'en' | 'fr',
  Record<string, string>
> = {
  en: {
    '1111': 'colored',
    '2222': 'to',
    '3333': 'newspaper',
    '4444': '100',
    '5555': 'NewsGap',
    '6666': 'begin',
  },

  fr: {
    '1111': 'colorées',
    '2222': 'passer',
    '3333': 'article',
    '4444': '100',
    '5555': 'NewsGap',
    '6666': 'commencer',
  },
}

export default function Practice() {
  const { config } = useConfig()
  const { lang } = useLang()

  const t = practiceTranslations[lang]
  const MASK_LABELS = MASK_LABELS_BY_LANG[lang]
  const PRACTICE_TEXT = PRACTICE_TEXT_BY_LANG[lang]
  const PRACTICE_ANSWERS = PRACTICE_ANSWERS_BY_LANG[lang]

  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<Map<string, Set<string>>>(
    new Map()
  )
  const [guessError, setGuessError] = useState<string | null>(null)

  const [revealedMasks, setRevealedMasks] = useState<
    Map<string, string>
  >(new Map())

  const [score, setScore] = useState(0)
  const [selectedMask, setSelectedMask] = useState<string | null>(
    null
  )

  const [timeRemaining, setTimeRemaining] = useState(
    config.timerDuration
  )

  const [isRevealed, setIsRevealed] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null
  )

  const answerInputRef = useRef<HTMLInputElement>(null)

  // Find which mask codes are present in the practice text.
  const presentMasks = useMemo(() => {
    return new Set<string>(
      PRACTICE_TEXT.match(
        /1111|2222|3333|4444|5555|6666/g
      ) ?? []
    )
  }, [PRACTICE_TEXT])

  /*
   * Reveal every practice answer.
   *
   * This is the Practice equivalent of Game.tsx fetching
   * the answer from the API when the game ends.
   */
  const revealAllAnswers = () => {
    const allAnswers = new Map<string, string>()

    presentMasks.forEach((mask) => {
      const answer = PRACTICE_ANSWERS[mask]

      if (answer) {
        allAnswers.set(mask, answer)
      }
    })

    setRevealedMasks(allAnswers)
  }

  /*
   * Countdown timer.
   *
   * This follows the same behavior as Game.tsx:
   * - Uses config.timerDuration
   * - Counts down once per second
   * - Stops at zero
   * - Reveals the answers when time expires
   */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (isRevealed) return

    if (timeRemaining <= 0) {
      setTimeRemaining(0)
      setIsRevealed(true)
      revealAllAnswers()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        if (newTime <= 0) {
          clearInterval(timer)
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [
    isRevealed,
    timeRemaining,
    presentMasks,
    PRACTICE_ANSWERS,
  ])

  /*
   * Format seconds in the same M:SS format as Game.tsx.
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /*
   * Give Up button.
   *
   * Game.tsx uses setTimeRemaining(0), so Practice does the same.
   * The timer effect then changes isRevealed to true and reveals
   * all answers.
   */
  const handleGiveUp = () => {
    if (isRevealed) return

    setTimeRemaining(0)
  }

  const handleGuessChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGuess(e.target.value)
    setGuessError(null)
  }

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedGuess = guess.toLowerCase().trim()

    if (!trimmedGuess || isRevealed) {
      return
    }

    if (!selectedMask) {
      setGuessError(t.selectPosFirst)
      return
    }

    // Prevent duplicate guesses for the same word type.
    if (guesses.get(selectedMask)?.has(trimmedGuess)) {
      setGuessError(
        t.alreadyGuessed(
          trimmedGuess,
          MASK_LABELS[selectedMask]
        )
      )

      return
    }

    // Record the guess.
    const newGuesses = new Map(guesses)

    if (!newGuesses.has(selectedMask)) {
      newGuesses.set(selectedMask, new Set())
    }

    newGuesses.get(selectedMask)!.add(trimmedGuess)

    setGuesses(newGuesses)
    setGuess('')
    setGuessError(null)

    // Check the locally defined practice answer.
    const correctAnswer = PRACTICE_ANSWERS[selectedMask]

    if (
      correctAnswer &&
      trimmedGuess === correctAnswer.toLowerCase()
    ) {
      const newScore = score + 100

      setScore(newScore)

      const newRevealedMasks = new Map(revealedMasks)
      newRevealedMasks.set(selectedMask, correctAnswer)

      setRevealedMasks(newRevealedMasks)

      /*
       * When all practice masks have been solved,
       * end the practice immediately just like Game.tsx.
       */
      if (newRevealedMasks.size >= presentMasks.size) {
        setIsRevealed(true)
        setTimeRemaining((current) => current)
        setSuccessMessage(t.congrats)
      }
    }
  }

  const renderMaskedText = () => {
    const parts = PRACTICE_TEXT.split(
      /(1111|2222|3333|4444|5555|6666)/
    )

    return parts.map((part, index) => {
      if (part in MASK_COLORS) {
        const maskColor =
          MASK_COLORS[
            part as keyof typeof MASK_COLORS
          ]

        const revealedWord = revealedMasks.get(part)
        const isBoxRevealed = !!revealedWord
        const isBoxSelected = selectedMask === part

        return (
          <Box
            key={index}
            component="span"
            onClick={
              isBoxRevealed || isRevealed
                ? undefined
                : () => {
                    setSelectedMask(part)
                    answerInputRef.current?.focus()
                  }
            }
            sx={{
              backgroundColor:
                successMessage && revealedWord
                  ? '#4caf50'
                  : maskColor,

              color: revealedWord
                ? 'white'
                : maskColor,

              padding: '1px 4px',
              borderRadius: '2px',
              fontWeight: 'bold',
              mx: 0.25,
              display: 'inline-block',
              minWidth: '40px',

              cursor:
                isBoxRevealed || isRevealed
                  ? 'default'
                  : 'pointer',

              outline:
                isBoxSelected && !isBoxRevealed && !isRevealed
                  ? '2px solid #333'
                  : 'none',

              outlineOffset: '2px',
            }}
          >
            {revealedWord || '___'}
          </Box>
        )
      }

      // Preserve paragraph breaks.
      const paragraphs = part.split('\n\n')

      return (
        <span key={index}>
          {paragraphs.map((paragraph, i) => (
            <span key={i}>
              {paragraph}

              {i < paragraphs.length - 1 && (
                <>
                  <br />
                  <br />
                </>
              )}
            </span>
          ))}
        </span>
      )
    })
  }

  const handleNext = () => {
    window.location.href = '/quiz'
  }

  return (
    <>
      <NavBar score={score} />

      <Box
        sx={{
          background: '#fafafa',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              background: '#ffffff',
              border: '1px solid #dddddd',
              boxShadow:
                '0 2px 8px rgba(0, 0, 0, 0.1)',
              p: { xs: 3, md: 4 },
            }}
          >
            {/* Newspaper masthead */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 2,
                pb: 1.5,
                borderBottom: '2px solid #000000',
                position: 'relative',
              }}
            >
              {/* Center - Title and timer */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontFamily:
                      '"Cormorant Garamond", Georgia, serif',
                    fontSize: {
                      xs: '0.85rem',
                      md: '1.2rem',
                    },
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    color: '#000000',
                    mb: 0.05,
                    fontStyle: 'italic',
                  }}
                >
                  {t.daily}
                </Typography>

                <Typography
                  sx={{
                    fontFamily:
                      '"Didot", "Playfair Display", Georgia, serif',
                    fontSize: {
                      xs: '2rem',
                      md: '2.8rem',
                    },
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

                {/* Countdown - same visual behavior as Game.tsx */}
                <Typography
                  sx={{
                    fontFamily:
                      '"Cormorant Garamond", Georgia, serif',
                    fontSize: {
                      xs: '1rem',
                      md: '1.32rem',
                    },
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color:
                      timeRemaining <= 10
                        ? '#d32f2f'
                        : '#666666',
                    textTransform: 'uppercase',
                  }}
                >
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>

              {/* Right - Score */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 0,
                  textAlign: 'right',
                  zIndex: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      color: '#666666',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {isRevealed
                      ? t.finalLabel
                      : t.scoreLabel}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: '#000000',
                      fontFamily: 'monospace',
                      display: 'inline-block',
                    }}
                  >
                    {score}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Timer and controls */}
            <Box
              sx={{
                mb: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {!isRevealed && (
                <Button
                  variant="outlined"
                  onClick={handleGiveUp}
                  sx={{
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',

                    '&:hover': {
                      backgroundColor: '#d32f2f',
                      color: '#ffffff',
                    },
                  }}
                >
                  {t.giveUp}
                </Button>
              )}

              {isRevealed && (
                <Button
                  variant="outlined"
                  onClick={handleNext}
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
                  {t.next}
                </Button>
              )}
            </Box>

            {/* Practice article */}
            <Box
              sx={{
                pt: 0,
                my: 0,
                mb: 3,
              }}
            >
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

            {/* Success message */}
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

            {/* Time-up message */}
            {isRevealed &&
              timeRemaining === 0 &&
              !successMessage && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    backgroundColor: '#e3f2fd',
                    color: '#0d47a1',
                    border: '1px solid #0d47a1',
                  }}
                >
                  {t.timesUp}
                </Alert>
              )}

            {/* Guess form */}
            <Box
              component="form"
              onSubmit={handleGuessSubmit}
              sx={{
                my: 4,
                borderTop: '1px solid #cccccc',
                pt: 3,
              }}
            >
              <FormControl
                component="fieldset"
                sx={{
                  mb: 2,
                  display: 'block',
                }}
              >
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
                  {t.wordTypeQuestion}
                </FormLabel>

                <RadioGroup
                  row
                  value={selectedMask ?? ''}
                  onChange={(e) =>
                    setSelectedMask(e.target.value)
                  }
                  sx={{
                    gap: {
                      xs: 0.5,
                      md: 2,
                    },
                    flexWrap: 'wrap',
                  }}
                >
                  {Object.keys(MASK_LABELS)
                    .filter((code) =>
                      presentMasks.has(code)
                    )
                    .map((code) => (
                      <FormControlLabel
                        key={code}
                        value={code}
                        disabled={revealedMasks.has(code)}
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: '#CCCCCC',

                              '&.Mui-checked': {
                                color:
                                  MASK_COLORS[
                                    code as keyof typeof MASK_COLORS
                                  ],
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              color:
                                MASK_COLORS[
                                  code as keyof typeof MASK_COLORS
                                ],
                            }}
                          >
                            {MASK_LABELS[code]}
                          </Typography>
                        }
                      />
                    ))}
                </RadioGroup>
              </FormControl>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  mt: 2,
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t.placeholder}
                  value={guess}
                  onChange={handleGuessChange}
                  error={!!guessError}
                  helperText={guessError}
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
                  }}
                >
                  {t.guessButton}
                </Button>
              </Box>
            </Box>

            {/* Guesses summary */}
            {guesses.size > 0 && (
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: '1px solid #cccccc',
                }}
              >
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
                  {t.yourAnswers} (
                  {Array.from(guesses.values()).reduce(
                    (n, s) => n + s.size,
                    0
                  )}
                  )
                </Typography>

                <Stack spacing={1.5}>
                  {Object.keys(MASK_LABELS)
                    .filter(
                      (code) =>
                        guesses.get(code)?.size
                    )
                    .map((code) => (
                      <Box
                        key={code}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          flexWrap: 'wrap',
                        }}
                      >
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

                        {Array.from(
                          guesses.get(code)!
                        ).map((word) => (
                          <Chip
                            key={word}
                            label={word}
                            size="small"
                            sx={{
                              backgroundColor:
                                '#f0f0f0',
                              fontFamily:
                                'Georgia, serif',
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
        </Container>
      </Box>
    </>
  )
}
