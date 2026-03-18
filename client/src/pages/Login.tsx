import { useState } from "react";
import { useLocation } from "wouter";
import { PieChart, ArrowRight, ShieldCheck, TrendingUp, Users, Mail, Lock, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isSignUp ? "/api/signup" : "/api/login";
      const body = isSignUp 
        ? { email, password, firstName, lastName }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || (isSignUp ? "Signup failed" : "Login failed"));
      }

      // Success, redirect to dashboard
      setLocation("/");
      window.location.reload(); // Refresh to update auth state
    } catch (err: any) {
      setError(err.message || (isSignUp ? "Failed to create account" : "Invalid email or password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Panel - Branding */}
      <div className="w-full md:w-1/2 bg-slate-900 text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">
              Prosper AI
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Master your money with <span className="text-emerald-400">AI-powered</span> insights.
          </h1>
          <p className="text-lg text-slate-300 max-w-md leading-relaxed">
            Join thousands of users who are building wealth and achieving financial freedom with personalized guidance.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 md:mt-0">
          <div className="flex flex-col gap-2">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold">Secure & Private</h3>
            <p className="text-xs text-slate-400">Bank-level encryption for your data.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold">Smart Growth</h3>
            <p className="text-xs text-slate-400">AI strategies tailored to your goals.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm mb-2">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold">Community</h3>
            <p className="text-xs text-slate-400">Learn with peers on the same journey.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth CTA */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-white">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? "Sign up to get started" : "Sign in to access your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-3">
              {isSignUp && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-4 px-6 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading 
                ? (isSignUp ? "Creating account..." : "Signing in...") 
                : (isSignUp ? "Create account" : "Sign in")
              }
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
