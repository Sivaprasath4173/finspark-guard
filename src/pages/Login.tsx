import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrustLensLogo } from "@/components/TrustLensLogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
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

          <form onSubmit={submit} className="mt-8 space-y-4">
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 border-border/70 bg-muted/30 pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="h-10 w-full">
              Sign in
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>

            <div className="relative py-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="relative z-10 bg-background px-2">or</span>
              <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => submit()}
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
