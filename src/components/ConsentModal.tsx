import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import { useLang } from '../contexts/LangContext'

const translations = {
  en: {
    title: 'Research Consent',
    body: 'This game has been made by a team of scientists at the École Normale Supérieure PSL in order to learn more about how written language is processed. We invite you to participate in our study, and request your consent for your data to be used for research purposes. If you agree to participate, your data will be anonymised and will not be used commercially or shared with other entities. Your participation in this study will remain confidential, as will all of your data associated with this website. Your individual privacy will be maintained in all published and written data resulting from the study and you have the right to withdraw your consent or discontinue participation at any time by emailing our team at this address:',
    suffix: 'This study involves no risk.',
    invite: "If you agree to participate, please click the 'I agree' button below.",
    agree: 'I agree',
    disagree: 'I do not agree',
  },
  fr: {
    title: 'Consentement à la recherche',
    body: "Ce jeu a été créé par une équipe de scientifiques de l'École Normale Supérieure PSL afin d'en apprendre davantage sur le traitement du langage écrit. Nous vous invitons à participer à notre étude et vous demandons votre consentement pour que vos données soient utilisées à des fins de recherche. Si vous acceptez de participer, vos données seront anonymisées et ne seront pas utilisées à des fins commerciales ni partagées avec d'autres entités. Votre participation à cette étude restera confidentielle, ainsi que toutes vos données associées à ce site web. Votre vie privée sera préservée dans toutes les données publiées et écrites résultant de l'étude, et vous avez le droit de retirer votre consentement ou d'interrompre votre participation à tout moment en envoyant un e-mail à notre équipe à l'adresse suivante :",
    suffix: "Cette étude ne présente aucun risque.",
    invite: "Si vous acceptez de participer, veuillez cliquer sur le bouton « J'accepte » ci-dessous.",
    agree: "J'accepte",
    disagree: "Je n'accepte pas",
  },
}

interface ConsentModalProps {
  open: boolean
  onAgree: () => void
  onDisagree: () => void
  loading?: boolean
}

export default function ConsentModal({ open, onAgree, onDisagree, loading = false }: ConsentModalProps) {
  const { lang } = useLang()
  const t = translations[lang]
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: '18px' }}>
        {t.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {t.body} <strong>newsgap@pm.me</strong>. {t.suffix}
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666' }}>
            {t.invite}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onDisagree} variant="outlined" disabled={loading} sx={{ textTransform: 'none' }}>
          {t.disagree}
        </Button>
        <Button onClick={onAgree} variant="contained" disabled={loading} sx={{ textTransform: 'none' }}>
          {t.agree}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
