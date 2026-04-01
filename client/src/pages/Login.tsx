import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, ArrowRight, ShieldCheck, TrendingUp, Users, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

const fadeSlide = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: "auto", marginTop: 12 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const featureCards = [
  { icon: ShieldCheck, title: "Secure & Private", desc: "Bank-level encryption for your data." },
  { icon: TrendingUp, title: "Smart Growth", desc: "AI strategies tailored to your goals." },
  { icon: Users, title: "Community", desc: "Learn with peers on the same journey." },
];

const INPUT_CLASS =
  "w-full pl-12 pr-4 py-4 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      setLocation("/");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || (isSignUp ? "Failed to create account" : "Invalid email or password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Panel - Branding */}
      <div className="w-full md:w-1/2 bg-slate-900 text-white p-6 py-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <motion.div
          className="relative z-10"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8 md:mb-12">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">
              Prosper
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-3xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-4 md:mb-6"
          >
            Master your money with <span className="text-emerald-400">AI-powered</span> insights.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="hidden md:block text-lg text-slate-300 max-w-md leading-relaxed"
          >
            Join thousands of users who are building wealth and achieving financial freedom with personalized guidance.
          </motion.p>
        </motion.div>

        <motion.div
          className="relative z-10 hidden md:grid grid-cols-3 gap-6"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {featureCards.map((card) => (
            <motion.div key={card.title} variants={fadeUp} className="flex flex-col gap-2">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm mb-2">
                <card.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold">{card.title}</h3>
              <p className="text-xs text-slate-400">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right Panel - Auth CTA */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-gradient-to-br from-white to-slate-50">
        <motion.div
          className="max-w-lg w-full space-y-10 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup-header" : "signin-header"}
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 font-display">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-slate-500 text-lg">
                {isSignUp ? "Sign up to get started" : "Sign in to access your dashboard"}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {isSignUp && (
                  <motion.div
                    key="name-fields"
                    className="space-y-4 overflow-hidden"
                    variants={fadeSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={INPUT_CLASS}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-4 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold text-base py-4 px-6 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                  ? <>Already have an account? <span className="underline">Sign in</span></> 
                  : <>Don't have an account? <span className="underline">Sign up</span></>
                }
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
