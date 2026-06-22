import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => register(email, password, name),
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
          <h1 className="screen-title text-xl mb-1">Create your account</h1>
          <p className="text-muted text-sm mb-5">Start locking in your habits today.</p>
          <form onSubmit={handleSubmit}>
            <Field label="Name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </Field>
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
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </Field>
            {mutation.isError && (
              <p className="text-danger text-[13px] mb-3">
                {(mutation.error as any)?.response?.data?.error || "Could not create account."}
              </p>
            )}
            <Button type="submit" className="w-full mt-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>
        <p className="text-center text-muted text-sm mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
