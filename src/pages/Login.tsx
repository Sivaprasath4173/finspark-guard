import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrustLensLogo } from "@/components/TrustLensLogo";
import { signIn, signInWithGoogle } from "@/services/firebase";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Successfully authenticated!");
      navigate("/overview");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully authenticated with Google!");
      navigate("/overview");
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    toast.success("Signed in as Demo Analyst.");
    navigate("/overview");
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden tl-network-bg p-10 lg:flex lg:flex-col">
        <div className="absolute inset-0 tl-node-grid opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-tr from-background/60 via-transparent to-background/30" />

        <div className="relative z-10 flex items-center gap-2">
          <TrustLensLogo size={36} />
          <span className="text-lg font-semibold tracking-tight">TrustLens</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/30">
            <Zap className="h-3 w-3" />
            FinSpark'26 · Banking Cybersecurity
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight">
            See the correlation
            <br />
            <span className="text-primary">others miss.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            TrustLens fuses cybersecurity telemetry with banking transactions in
            real time — scoring composite risk with a z-score anomaly engine and
            generating plain-English analyst briefs for every alert.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <StatCell k="1.8m" v="Avg detection" />
            <StatCell k="99.2%" v="Correlation recall" />
            <StatCell k="$14M" v="Fraud averted / wk" />
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © 2026 TrustLens Labs — SOC prototype
        </div>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center bg-background px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-1 flex items-center gap-2 lg:hidden">
            <TrustLensLogo size={32} />
            <span className="text-lg font-semibold tracking-tight">TrustLens</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Access the correlation console.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Work email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@bank.com"
                  className="h-10 border-border/70 bg-muted/30 pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 border-border/70 bg-muted/30 pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="h-10 w-full">
              {isLoading ? "Signing in..." : "Sign in"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-10 w-full flex items-center justify-center gap-2 border border-border bg-muted/20 hover:bg-muted"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative py-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="relative z-10 bg-background px-2">or</span>
              <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="h-10 w-full border border-border bg-muted/40 hover:bg-muted"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Sign in as Demo Analyst
            </Button>
          </form>

          <p className="mt-8 text-[11px] leading-relaxed text-muted-foreground">
            Protected by TrustLens Adaptive Auth. All sessions are logged and
            correlated across telemetry channels.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/40 px-3 py-2 backdrop-blur">
      <div className="text-lg font-semibold tabular-nums text-foreground">{k}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {v}
      </div>
    </div>
  );
}
