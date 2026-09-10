/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './types.ts'

interface CommercialAccessProps {
  fullName?: string
  email?: string
  password?: string
  loginUrl?: string
}

const CommercialAccessEmail = ({
  fullName = 'Philippe Hélard',
  email = 'commercial@exemple.fr',
  password = 'Mot de passe provisoire',
  loginUrl = 'https://highsocietybotanicals.com/auth',
}: CommercialAccessProps) => (
  <Html lang="fr">
    <Head />
    <Preview>Vos accès Commercial et Pro High Society Botanicals</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section style={brandBar} />
        <Section style={content}>
          <Text style={eyebrow}>HIGH SOCIETY BOTANICALS</Text>
          <Heading style={heading}>Bienvenue dans l’équipe, {fullName}</Heading>
          <Text style={paragraph}>
            Votre espace personnel est prêt. Il vous donne accès aux outils de prospection,
            au catalogue professionnel, aux analyses laboratoire, aux tarifs revendeurs,
            aux devis et au suivi de vos commissions.
          </Text>
          <Section style={credentials}>
            <Text style={credentialLabel}>IDENTIFIANT</Text>
            <Text style={credentialValue}>{email}</Text>
            <Text style={credentialLabel}>MOT DE PASSE PROVISOIRE</Text>
            <Text style={passwordValue}>{password}</Text>
          </Section>
          <Section style={buttonRow}>
            <Button href={loginUrl} style={button}>Accéder à mon espace</Button>
          </Section>
          <Text style={paragraph}>
            Après connexion, les entrées « Espace Commercial » et « Espace Pro » seront disponibles
            depuis le menu de votre compte. Pour votre sécurité, modifiez ce mot de passe dès votre
            première connexion.
          </Text>
          <Hr style={rule} />
          <Text style={signature}>
            High Society Botanicals<br />Abbaretz — Loire-Atlantique
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const body = { margin: '0', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '36px auto', backgroundColor: '#111111', border: '1px solid #d0ae66', borderRadius: '8px', overflow: 'hidden' }
const brandBar = { height: '5px', backgroundColor: '#c8a85d' }
const content = { padding: '40px 34px' }
const eyebrow = { color: '#c8a85d', fontSize: '11px', letterSpacing: '2px', textAlign: 'center' as const, margin: '0 0 14px' }
const heading = { color: '#f7f2e7', fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 'normal', lineHeight: '1.25', textAlign: 'center' as const, margin: '0 0 24px' }
const paragraph = { color: '#d0c9b9', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }
const credentials = { backgroundColor: '#1a1a1a', border: '1px solid #393329', borderRadius: '6px', padding: '22px', margin: '0 0 28px' }
const credentialLabel = { color: '#8f8778', fontSize: '10px', letterSpacing: '1.5px', margin: '0 0 6px' }
const credentialValue = { color: '#f7f2e7', fontSize: '16px', margin: '0 0 20px' }
const passwordValue = { color: '#d8b96f', fontSize: '21px', fontWeight: 'bold', margin: '0' }
const buttonRow = { textAlign: 'center' as const, margin: '0 0 28px' }
const button = { backgroundColor: '#c8a85d', color: '#111111', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', padding: '14px 28px', textDecoration: 'none' }
const rule = { borderColor: '#393329', margin: '26px 0' }
const signature = { color: '#8f8778', fontSize: '12px', lineHeight: '1.6', textAlign: 'center' as const, margin: '0' }

export const template = {
  component: CommercialAccessEmail as React.ComponentType<Record<string, unknown>>,
  subject: (data) => `Vos accès Commercial et Pro — High Society Botanicals${data.fullName ? ` · ${String(data.fullName)}` : ''}`,
  displayName: 'Accès Commercial et Pro',
  previewData: {
    fullName: 'Philippe Hélard',
    email: 'commercial@exemple.fr',
    password: 'Mot de passe provisoire',
    loginUrl: 'https://highsocietybotanicals.com/auth',
  },
} satisfies TemplateEntry