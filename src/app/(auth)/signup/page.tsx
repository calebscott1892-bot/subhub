import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#dbe3dc] bg-white p-6">
        <Link href="/dashboard" className="text-lg font-semibold text-[#16201d]">
          Subscription Hub
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Create account</h1>
        <form className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Email</span>
            <input
              type="email"
              className="h-11 w-full rounded-md border border-[#cbd8d0] px-3 text-sm outline-none focus:border-[#176143]"
              placeholder="alex@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Password</span>
            <input
              type="password"
              className="h-11 w-full rounded-md border border-[#cbd8d0] px-3 text-sm outline-none focus:border-[#176143]"
            />
          </label>
          <Link
            href="/onboarding"
            className="block rounded-md bg-[#16362f] px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            Start setup
          </Link>
        </form>
        <p className="mt-5 text-sm text-[#68766f]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#176143]">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
