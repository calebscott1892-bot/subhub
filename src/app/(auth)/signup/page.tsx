import Link from "next/link";
import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/session";
import { signupAction } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  email: "Enter a valid email address.",
  password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  exists: "An account with that email already exists. Log in instead.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? null) : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#dbe3dc] bg-white p-6">
        <span className="text-lg font-semibold text-[#16201d]">
          Subscription Hub
        </span>
        <h1 className="mt-8 text-3xl font-semibold">Create account</h1>
        {errorMessage ? (
          <p className="mt-4 rounded-md border border-[#dfc4c2] bg-[#fff7f6] px-3 py-2 text-sm text-[#8f332b]">
            {errorMessage}
          </p>
        ) : null}
        <form action={signupAction} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Name</span>
            <input
              type="text"
              name="displayName"
              autoComplete="name"
              className="h-11 w-full rounded-md border border-[#cbd8d0] px-3 text-sm outline-none focus:border-[#176143]"
              placeholder="Alex"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="h-11 w-full rounded-md border border-[#cbd8d0] px-3 text-sm outline-none focus:border-[#176143]"
              placeholder="alex@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#34443f]">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="h-11 w-full rounded-md border border-[#cbd8d0] px-3 text-sm outline-none focus:border-[#176143]"
            />
          </label>
          <button
            type="submit"
            className="block w-full rounded-md bg-[#16362f] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Start setup
          </button>
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
