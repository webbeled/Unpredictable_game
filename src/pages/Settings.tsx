import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useConfig } from '../contexts/ConfigContext'

export default function Settings() {
  const navigate = useNavigate()
  const { config, updateConfig, resetConfig } = useConfig()
  const [timerDuration, setTimerDuration] = useState(config.timerDuration)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleSave = () => {
    if (timerDuration < 1) {
      setSaveMessage('Timer duration must be at least 1 second')
      return
    }
    if (timerDuration > 3600) {
      setSaveMessage('Timer duration must be less than 3600 seconds (1 hour)')
      return
    }
    updateConfig({ timerDuration })
    setSaveMessage('Settings saved successfully!')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleReset = () => {
    resetConfig()
    setTimerDuration(60)
    setSaveMessage('Settings reset to defaults')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Game Configuration
            </Typography>

            {saveMessage && (
              <Alert
                severity={saveMessage.includes('successfully') || saveMessage.includes('reset') ? 'success' : 'error'}
                sx={{ mb: 3 }}
              >
                {saveMessage}
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Timer Duration (seconds)"
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                helperText="Set how long players have to guess the word"
                inputProps={{ min: 1, max: 3600 }}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  fullWidth
                >
                  Save Settings
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleReset}
                  fullWidth
                >
                  Reset to Defaults
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Current timer: {config.timerDuration} seconds
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  )
}
