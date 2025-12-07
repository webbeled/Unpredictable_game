import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from './contexts/ConfigContext'
import Game from './pages/Game'
import Settings from './pages/Settings'

const queryClient = new QueryClient()

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConfigProvider>
          <Router>
            <Routes>
              <Route path="/quiz" element={<Game />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Router>
        </ConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
