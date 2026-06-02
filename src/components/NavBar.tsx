import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import HomeIcon from '@mui/icons-material/Home'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

interface NavBarProps {
  score?: number
}

export default function NavBar({ score }: NavBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const { lang, setLang } = useLang()
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
          justifyContent: 'flex-start',
          position: 'relative',
          py: 1,
          px: 3,
        }}
      >
        {/* Left: score */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mr: 'auto',
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
        </Box>

        {/* Center: logout (absolutely centered in toolbar) */}
        <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={() => logout().then(() => navigate('/auth'))} sx={{ color: '#000000' }}>
            <LogoutIcon />
          </IconButton>
          {user && (
            <Typography sx={{ fontSize: '0.75rem', color: '#666666', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </Typography>
          )}
        </Box>

        {/* Right: language toggle */}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          {(['en', 'fr'] as const).map((l) => (
            <Box
              key={l}
              onClick={() => setLang(l)}
              sx={{
                fontSize: '20px',
                lineHeight: 1,
                cursor: 'pointer',
                borderRadius: '6px',
                p: '3px 5px',
                border: '2px solid',
                borderColor: lang === l ? '#555' : 'transparent',
                transition: 'border-color 0.2s ease',
                userSelect: 'none',
                '&:hover': { borderColor: lang === l ? '#555' : '#bbb' },
              }}
            >
              {l === 'en' ? '🇬🇧' : '🇫🇷'}
            </Box>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
