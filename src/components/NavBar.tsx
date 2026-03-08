import { AppBar, Toolbar, Typography, IconButton } from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface NavBarProps {
  score?: number
}

export default function NavBar({ score }: NavBarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <AppBar position="static">
      <Toolbar>
        <ArticleIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          NewsGap
        </Typography>
        {score !== undefined && (
          <Typography variant="h6" component="div" sx={{ mr: 3, fontWeight: 'bold' }}>
            Score: {score}
          </Typography>
        )}
        <IconButton color="inherit" onClick={() => navigate('/settings')}>
          <SettingsIcon />
        </IconButton>
        <IconButton color="inherit" onClick={() => logout().then(() => navigate('/auth'))}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
