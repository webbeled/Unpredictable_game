import { AppBar, Toolbar, Typography, IconButton, Box, Badge, Popover, Button, Divider } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import HomeIcon from '@mui/icons-material/Home'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface FriendRequest {
  id: number
  sender_code: string
  created_at: number
}

interface NavBarProps {
  score?: number
}

export default function NavBar({ score }: NavBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const { lang, setLang } = useLang()
  const isGamePage = location.pathname === '/quiz'
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const queryClient = useQueryClient()

  const { data: pendingRequests = [] } = useQuery<FriendRequest[]>({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const res = await fetch('/api/friends/requests', { credentials: 'include' })
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!user && !isGamePage,
    refetchInterval: 30000,
  })

  const handleAccept = async (id: number) => {
    await fetch(`/api/friends/accept/${id}`, { method: 'POST', credentials: 'include' })
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    queryClient.invalidateQueries({ queryKey: ['friends'] })
  }

  const handleDecline = async (id: number) => {
    await fetch(`/api/friends/decline/${id}`, { method: 'POST', credentials: 'include' })
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
  }

  if (isGamePage) {
    return (
      <Box sx={{ background: '#ffffff', borderBottom: '1px solid #dddddd', py: 1, px: 3, display: 'flex', justifyContent: 'center' }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: '#000000', '&:hover': { backgroundColor: '#f5f5f5' } }}>
          <HomeIcon />
        </IconButton>
      </Box>
    )
  }

  return (
    <AppBar position="static" sx={{ background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderBottom: '1px solid #cccccc' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', position: 'relative', py: 1, px: 3 }}>

        {/* Left: notification bell + participant code */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 'auto' }}>
          {user && (
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: '#000', p: 0.5 }}>
              <Badge
                badgeContent={pendingRequests.length}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '10px', minWidth: '16px', height: '16px' } }}
              >
                <NotificationsIcon sx={{ fontSize: '22px' }} />
              </Badge>
            </IconButton>
          )}
          {user?.participant_code && (
            <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#aaa', mb: 0.2 }}>
                {lang === 'en' ? 'Your Code' : 'Votre Code'}
              </Typography>
              <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: '#000' }}>
                {user.participant_code}
              </Typography>
            </Box>
          )}
          {score !== undefined && (
            <Typography sx={{ fontWeight: 700, color: '#000000', fontSize: '0.95rem' }}>
              Score: {score}
            </Typography>
          )}
        </Box>

        {/* Center: logout + email */}
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
                fontSize: '20px', lineHeight: 1, cursor: 'pointer', borderRadius: '6px', p: '3px 5px',
                border: '2px solid', borderColor: lang === l ? '#555' : 'transparent',
                transition: 'border-color 0.2s ease', userSelect: 'none',
                '&:hover': { borderColor: lang === l ? '#555' : '#bbb' },
              }}
            >
              {l === 'en' ? '🇬🇧' : '🇫🇷'}
            </Box>
          ))}
        </Box>
      </Toolbar>

      {/* Notifications popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: { borderRadius: 0, border: '2px solid #000', boxShadow: '4px 4px 0 rgba(0,0,0,0.12)', minWidth: 280, maxWidth: 340 }
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #eee' }}>
          <Typography sx={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, color: '#333' }}>
            {lang === 'en' ? 'Friend Requests' : "Demandes d'amis"}
          </Typography>
        </Box>
        {pendingRequests.length === 0 ? (
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
              {lang === 'en' ? 'No pending requests' : 'Aucune demande en attente'}
            </Typography>
          </Box>
        ) : (
          pendingRequests.map((req, i) => (
            <Box key={req.id}>
              {i > 0 && <Divider />}
              <Box sx={{ px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#111', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
                  <strong>{req.sender_code}</strong>{' '}
                  {lang === 'en' ? 'wants to be your friend' : 'veut être votre ami(e)'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => { handleAccept(req.id); setAnchorEl(null) }}
                    sx={{ fontSize: '0.7rem', px: 1.5, py: 0.4, bgcolor: '#000', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.5px', '&:hover': { bgcolor: '#333' } }}
                  >
                    {lang === 'en' ? 'Accept' : 'Accepter'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => { handleDecline(req.id); setAnchorEl(null) }}
                    sx={{ fontSize: '0.7rem', px: 1.5, py: 0.4, borderColor: '#000', color: '#000', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.5px', '&:hover': { bgcolor: '#f5f5f5' } }}
                  >
                    {lang === 'en' ? 'Decline' : 'Refuser'}
                  </Button>
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Popover>
    </AppBar>
  )
}
