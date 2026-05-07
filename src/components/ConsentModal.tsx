import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'

interface ConsentModalProps {
  open: boolean
  onAgree: () => void
  onDisagree: () => void
  loading?: boolean
}

export default function ConsentModal({ open, onAgree, onDisagree, loading = false }: ConsentModalProps) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: '18px' }}>
        Research Consent
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            This game has been made by a team of scientists at the École Normale Supérieure PSL in order to learn more about how written language is processed. We invite you to participate in our study, and request your consent for your data to be used for research purposes. If you agree to participate, your data will be anonymised and will not be used commercially or shared with other entities. Your participation in this study will remain confidential, as will all of your data associated with this website. Your individual privacy will be maintained in all published and written data resulting from the study and you have the right to withdraw your consent or discontinue participation at any time by emailing our team at this address: <strong>newsgap@pm.me</strong>. This study involves no risk.
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666' }}>
            If you agree to participate, please click the 'I agree' button below.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onDisagree}
          variant="outlined"
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          I do not agree
        </Button>
        <Button
          onClick={onAgree}
          variant="contained"
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          I agree
        </Button>
      </DialogActions>
    </Dialog>
  )
}
