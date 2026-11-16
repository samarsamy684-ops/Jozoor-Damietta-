import { AdminAuthForm } from '@/components/admin-auth-form'

export const dynamic = 'force-dynamic'

export default function AdminSignInPage() {
  if (!process.env.WORKSHOP_ADMIN_EMAIL) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f7f3] px-5 py-12 text-[#1f3b36]">
        <section className="w-full max-w-lg rounded-3xl border border-[#dfdfd6] bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b4823e]">Admin setup needed</p>
          <h1 className="mt-3 font-serif text-3xl">Set the admin email</h1>
          <p className="mt-3 leading-7 text-[#65675f]">The request dashboard is restricted to one verified email address. Configure <code className="rounded bg-[#f1f0ea] px-1.5 py-0.5">WORKSHOP_ADMIN_EMAIL</code> before signing in.</p>
        </section>
      </main>
    )
  }

  return <AdminAuthForm />
}
