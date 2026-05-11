import mailchimp from '@mailchimp/mailchimp_transactional'

const client = mailchimp(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY || '')

interface EmailRecipient {
  email: string
  name?: string
  type?: 'to' | 'cc' | 'bcc'
}

interface SendEmailOptions {
  to: EmailRecipient[]
  subject: string
  html: string
  text?: string
  fromEmail?: string
  fromName?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromEmail = 'contact@leoandgo.com',
  fromName = 'Leo&Go',
}: SendEmailOptions) {
  try {
    const response = await client.messages.send({
      message: {
        from_email: fromEmail,
        from_name: fromName,
        to: to.map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
          type: recipient.type || 'to',
        })),
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      },
    })

    console.log('Email sent successfully:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

interface ContactNotificationData {
  email: string
  phone?: string
  vehicleName?: string
  estimatedPrice?: number
  durationMinutes?: number
  distanceKm?: number
  departureDateTime?: string
  returnDateTime?: string
  airportOption?: boolean
  predeliveryOption?: boolean
}

function formatDuration(minutes: number): string {
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60

  let text = ''
  if (days > 0) text += `${days}j `
  if (hours > 0) text += `${hours}h `
  if (mins > 0) text += `${mins}min`
  return text.trim() || '0 min'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function sendContactNotificationToAdmin(data: ContactNotificationData) {
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@leoandgo.com'

  const options: string[] = []
  if (data.airportOption) options.push('Option aeroport')
  if (data.predeliveryOption) options.push('Pre-livraison')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #653A8E 0%, #7d4fa8 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Nouvelle demande de contact</h1>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #653A8E; margin-top: 0;">Details de la demande</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email client:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.email}</td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Telephone:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="tel:${data.phone}" style="color: #653A8E; font-weight: bold;">${data.phone}</a></td>
          </tr>
          ` : ''}
          ${data.vehicleName ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vehicule:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.vehicleName}</td>
          </tr>
          ` : ''}
          ${data.estimatedPrice ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Prix estime:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #27ae60; font-weight: bold;">${data.estimatedPrice.toFixed(2)} EUR</td>
          </tr>
          ` : ''}
          ${data.durationMinutes ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Duree:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDuration(data.durationMinutes)}</td>
          </tr>
          ` : ''}
          ${data.distanceKm ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Distance:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.distanceKm} km</td>
          </tr>
          ` : ''}
          ${data.departureDateTime ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Depart:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(data.departureDateTime)}</td>
          </tr>
          ` : ''}
          ${data.returnDateTime ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Retour:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(data.returnDateTime)}</td>
          </tr>
          ` : ''}
          ${options.length > 0 ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Options:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${options.join(', ')}</td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #653A8E; border-radius: 8px; text-align: center;">
          <a href="mailto:${data.email}" style="color: white; text-decoration: none; font-weight: bold;">
            Repondre au client
          </a>
        </div>
      </div>

      <div style="padding: 15px; background: #333; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Leo&Go - Simulateur de prix
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: [{ email: adminEmail, name: 'Leo&Go Admin' }],
    subject: `Nouvelle demande de devis - ${data.email}`,
    html,
  })
}

export async function sendContactConfirmationToUser(data: ContactNotificationData) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #653A8E 0%, #7d4fa8 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Merci pour votre demande!</h1>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Bonjour,
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Nous avons bien recu votre demande de devis et nous vous recontacterons dans les plus brefs delais.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #653A8E; margin-top: 0;">Recapitulatif de votre demande</h3>

          ${data.vehicleName ? `<p><strong>Vehicule:</strong> ${data.vehicleName}</p>` : ''}
          ${data.estimatedPrice ? `<p><strong>Prix estime:</strong> <span style="color: #27ae60; font-weight: bold;">${data.estimatedPrice.toFixed(2)} EUR</span></p>` : ''}
          ${data.durationMinutes ? `<p><strong>Duree:</strong> ${formatDuration(data.durationMinutes)}</p>` : ''}
          ${data.distanceKm ? `<p><strong>Distance:</strong> ${data.distanceKm} km</p>` : ''}
          ${data.departureDateTime ? `<p><strong>Depart:</strong> ${formatDate(data.departureDateTime)}</p>` : ''}
          ${data.returnDateTime ? `<p><strong>Retour:</strong> ${formatDate(data.returnDateTime)}</p>` : ''}
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Si vous avez des questions, n'hesitez pas a nous contacter.
        </p>

        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          A bientot,<br>
          <strong>L'equipe Leo&Go</strong>
        </p>
      </div>

      <div style="padding: 15px; background: #333; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Leo&Go - Location de vehicules en libre-service a Lyon
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: [{ email: data.email }],
    subject: 'Confirmation de votre demande de devis - Leo&Go',
    html,
  })
}
