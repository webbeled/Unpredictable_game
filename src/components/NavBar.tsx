import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import HomeIcon from '@mui/icons-material/Home'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface NavBarProps {
  score?: number
}

export default function NavBar({ score }: NavBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const isGamePage = location.pathname === '/quiz'

  const handleLogoClick = () => navigate('/')

  if (isGamePage) {
    // Game page - show centered home icon button
    return (
      <Box sx={{ background: '#ffffff', borderBottom: '1px solid #dddddd', py: 1, px: 3, display: 'flex', justifyContent: 'center' }}>
        <IconButton 
          onClick={handleLogoClick}
          sx={{ 
            color: '#000000',
            '&:hover': { 
              backgroundColor: '#f5f5f5',
            }
          }}
        >
          <HomeIcon />
        </IconButton>
      </Box>
    )
  }

  // Home/other pages - show full header with navigation
  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #cccccc'
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          py: 1,
          px: 3,
        }}
      >
        {/* Controls on right */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {score !== undefined && (
            <Typography
              sx={{ 
                fontWeight: 700, 
                color: '#000000',
                fontSize: '0.95rem',
              }}
            >
              Score: {score}
            </Typography>
          )}
          <IconButton color="inherit" onClick={() => navigate('/settings')} sx={{ color: '#000000' }}>
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => logout().then(() => navigate('/auth'))} sx={{ color: '#000000' }}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
