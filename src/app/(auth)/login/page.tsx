import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { loginAction } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "That email and password combination does not match.",
};

export default async function LoginPage({
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
        <h1 className="mt-8 text-3xl font-semibold">Log in</h1>
        {errorMessage ? (
          <p className="mt-4 rounded-md border border-[#dfc4c2] bg-[#fff7f6] px-3 py-2 text-sm text-[#8f332b]">
            {errorMessage}
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
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
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-[#cbd8d0] px-3 text-sm outline-none focus:border-[#176143]"
            />
          </label>
          <button
            type="submit"
            className="block w-full rounded-md bg-[#16362f] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#214d43]"
          >
            Continue
          </button>
        </form>
        <p className="mt-5 text-sm text-[#68766f]">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[#176143]">
            Create an account
          </Link>
        </p>
        <div className="mt-6 rounded-md border border-[#dbe3dc] bg-[#f8faf7] p-3 text-xs leading-5 text-[#68766f]">
          Demo workspace: <span className="font-semibold">demo@subhub.local</span>{" "}
          / <span className="font-semibold">subhub-demo</span> comes pre-loaded
          with sample subscriptions after running <code>npm run db:seed</code>.
        </div>
      </section>
    </main>
  );
}
