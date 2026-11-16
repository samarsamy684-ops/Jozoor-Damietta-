'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth/client'

type AuthMode = 'sign-in' | 'sign-up' | 'verify'

export function AdminAuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsPending(true)

    try {
      if (mode === 'sign-up') {
        const result = await authClient.signUp.email({ email, password, name: name.trim() })
        if (result.error) throw new Error(result.error.message || 'Account creation failed.')
        setMode('verify')
        setMessage('We sent a verification code to your email. Enter it below to finish creating your account.')
        return
      }

      if (mode === 'verify') {
        const result = await authClient.emailOtp.verifyEmail({ email, otp: otp.trim() })
        if (result.error) throw new Error(result.error.message || 'That verification code could not be accepted.')
        const signIn = await authClient.signIn.email({ email, password })
        if (signIn.error) throw new Error(signIn.error.message || 'Email verified. Sign in with your password to continue.')
        router.replace('/admin')
        router.refresh()
        return
      }

      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message || 'Sign-in failed. Check your email and password.')
      router.replace('/admin')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  const resendCode = async () => {
    setMessage('')
    setError('')
    setIsPending(true)
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' })
      if (result.error) throw new Error(result.error.message || 'Could not resend the verification code.')
      setMessage('A new verification code has been sent.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resend the verification code.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f7f3] px-5 py-12 text-[#1f3b36]">
      <section className="w-full max-w-lg rounded-3xl border border-[#dfdfd6] bg-white p-7 shadow-sm sm:p-9">
        <a href="/" className="text-sm font-semibold text-[#777970] transition hover:text-[#1f3b36]">Jozzor Damietta Marketable plus</a>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#b4823e]">Private workshop review</p>
        <h1 className="mt-3 font-serif text-3xl">{mode === 'sign-in' ? 'Admin sign in' : mode === 'sign-up' ? 'Create admin account' : 'Verify your email'}</h1>
        <p className="mt-3 leading-6 text-[#65675f]">Only the configured, verified administrator can review requests or publish products.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'sign-up' && <label className="block text-sm font-semibold">Name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8d8ce] px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>}
          <label className="block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8d8ce] px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>
          {mode !== 'verify' && <label className="block text-sm font-semibold">Password<input required type="password" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8d8ce] px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>}
          {mode === 'verify' && <label className="block text-sm font-semibold">Verification code<input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8d8ce] px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>}
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="text-sm text-[#1f3b36]">{message}</p>}
          <button disabled={isPending} aria-busy={isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3b36] px-5 py-3.5 font-semibold text-white transition hover:bg-[#2d5049] disabled:cursor-wait disabled:opacity-60">
            {isPending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Verify and continue'}
            {!isPending && <ArrowRight size={18} aria-hidden="true" />}
          </button>
          {mode === 'verify' && <button type="button" disabled={isPending} onClick={resendCode} className="w-full text-sm font-semibold text-[#1f3b36] underline underline-offset-4 disabled:opacity-50">Resend code</button>}
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-[#ebeae4] pt-5 text-sm">
          {mode === 'sign-in' ? <button type="button" onClick={() => { setMode('sign-up'); setError(''); setMessage('') }} className="font-semibold text-[#1f3b36]">Create the first admin account</button> : <button type="button" onClick={() => { setMode('sign-in'); setError(''); setMessage('') }} className="inline-flex items-center gap-1 font-semibold text-[#1f3b36]"><ArrowLeft size={16} aria-hidden="true" /> Back to sign in</button>}
          <a href="/" className="text-[#777970] hover:text-[#1f3b36]">Return to shop</a>
        </div>
      </section>
    </main>
  )
}
