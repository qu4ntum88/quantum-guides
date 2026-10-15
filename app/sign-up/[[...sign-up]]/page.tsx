import { SignUp } from '@clerk/nextjs'

export const metadata = { title: 'Sign Up | Quantum Game Guides', robots: { index: false, follow: true } }

export default function SignUpPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
      <SignUp />
    </main>
  )
}
