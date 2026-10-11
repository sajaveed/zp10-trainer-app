export function getUserName(user) {
  return user?.user_metadata?.first_name?.trim() || user?.email?.split('@')[0] || 'Nutzer'
}
