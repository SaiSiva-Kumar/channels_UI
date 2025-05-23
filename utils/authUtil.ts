import { auth } from '../app/firebase_config'
import { onAuthStateChanged } from 'firebase/auth'

export const checkTokenExpiration = async (currentToken: string): Promise<string | false> => {
  try {
    if (!currentToken) {
      return false
    }

    const tokenParts = currentToken.split('.')
    if (tokenParts.length !== 3) {
      return false
    }

    const payload = JSON.parse(atob(tokenParts[1]))
    const expirationTime = payload.exp * 1000
    const currentTime = Date.now()
    const timeUntilExpiry = expirationTime - currentTime

    if (timeUntilExpiry > 120000) {
      return false
    }

    const currentUser = auth.currentUser
    if (currentUser) {
      return await currentUser.getIdToken(true)
    }

    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const newToken = await user.getIdToken(true)
          resolve(newToken)
        } else {
          resolve(false)
        }
      })
    })
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return false
  }
}
