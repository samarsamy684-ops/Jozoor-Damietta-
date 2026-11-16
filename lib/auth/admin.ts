import { auth } from './server'

export async function getAdminUser() {
  const configuredEmail = process.env.WORKSHOP_ADMIN_EMAIL?.trim().toLowerCase()
  if (!configuredEmail) return null

  const { data } = await auth.getSession()
  const user = data?.user
  if (!user?.email || !user.emailVerified || user.email.toLowerCase() !== configuredEmail) return null

  return { id: user.id, name: user.name, email: user.email }
}
