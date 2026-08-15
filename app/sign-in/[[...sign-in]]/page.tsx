import { SignIn } from '@clerk/nextjs'
import SignInLoadGuard from './SignInLoadGuard'

export default function SignInPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
      {/* SignIn renders nothing at all if clerk-js never loads, which leaves a blank
          page and no explanation. The guard watches for that and explains it. */}
      <SignInLoadGuard>
        <SignIn />
      </SignInLoadGuard>
    </main>
  )
}
