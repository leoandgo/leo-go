declare module '@mailchimp/mailchimp_transactional' {
  interface Recipient {
    email: string
    name?: string
    type?: 'to' | 'cc' | 'bcc'
  }

  interface Message {
    from_email: string
    from_name?: string
    to: Recipient[]
    subject: string
    html?: string
    text?: string
  }

  interface SendMessageParams {
    message: Message
  }

  interface MessagesApi {
    send(params: SendMessageParams): Promise<unknown>
  }

  interface UsersApi {
    ping(): Promise<unknown>
  }

  interface MailchimpClient {
    messages: MessagesApi
    users: UsersApi
  }

  function mailchimp(apiKey: string): MailchimpClient
  export = mailchimp
}
