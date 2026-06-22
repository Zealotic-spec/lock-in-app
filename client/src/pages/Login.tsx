import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate("/", { replace: true });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg px-4">
      <div className="w-full max-w-sm fade-in">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Logo />
          <span className="screen-title text-2xl">Lock-in</span>
        </div>
        <div className="card card-glow p-6">
          <h1 className="screen-title text-xl mb-1">Welcome back</h1>
          <p className="text-muted text-sm mb-5">Log in to keep your streak alive.</p>
          <form onSubmit={handleSubmit}>
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            {mutation.isError && (
              <p className="text-danger text-[13px] mb-3">
                {(mutation.error as any)?.response?.data?.error || "Invalid email or password."}
              </p>
            )}
            <Button type="submit" className="w-full mt-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </div>
        <p className="text-center text-muted text-sm mt-5">
          No account?{" "}
          <Link to="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
