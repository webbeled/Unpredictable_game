import { useQuery } from '@tanstack/react-query'

export interface QuizEntry {
  id: string
  fileName: string
  sheetName: string
  annotate: string
}

export interface QuizAnswer {
  id: string
  solution: string
}

export interface GuessResponse {
  correct: boolean
  solution?: string
}

export const useQuiz = () => {
  return useQuery<QuizEntry>({
    queryKey: ['quiz'],
    queryFn: async () => {
      const response = await fetch('/api/quiz/')
      if (!response.ok) throw new Error('Failed to fetch quiz')
      return response.json()
    },
  })
}

export const useQuizAnswer = (id: string) => {
  return useQuery<QuizAnswer>({
    queryKey: ['quiz', id, 'answer'],
    queryFn: async () => {
      const response = await fetch(`/api/quiz/${id}/answer`)
      if (!response.ok) throw new Error('Failed to fetch answer')
      return response.json()
    },
    enabled: false, // Don't fetch automatically
  })
}

export const useGuessSubmit = (id: string, guess: string) => {
  return useQuery<GuessResponse>({
    queryKey: ['quiz', id, 'guess', guess],
    queryFn: async () => {
      const response = await fetch(`/api/quiz/${id}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess }),
      })
      if (!response.ok) throw new Error('Failed to submit guess')
      return response.json()
    },
    enabled: false, // Don't fetch automatically
  })
}
