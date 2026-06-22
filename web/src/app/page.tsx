import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from '@clerk/nextjs'

export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Construction Project Copilot</h1>

      <Show when="signed-out">
        <p>You are signed out.</p>
        <SignInButton mode="modal">
          <button style={{ marginRight: 10 }}>Sign in</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button>Sign up</button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <p>You are signed in.</p>
        <UserButton />
      </Show>
    </main>
  )
}