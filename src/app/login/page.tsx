"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase, validateEmail } from "@/lib/supabase";
import { useToast } from "@/components/toast";

export default function LoginPage() {
    const router = useRouter();
    const toast = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            if (isLogin) {
                // Sign In
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    // Check for specific error types
                    if (signInError.message.includes("Email not confirmed")) {
                        setError("Please verify your email before logging in. Check your inbox for the verification link.");
                        toast.error("Email not verified - check your inbox");
                    } else {
                        setError(signInError.message);
                        toast.error(signInError.message);
                    }
                } else if (data.user) {
                    // Double-check email verification status
                    if (!data.user.email_confirmed_at) {
                        // User logged in but email not verified - sign them out
                        await supabase.auth.signOut();
                        setError("Please verify your email before logging in. Check your inbox for the verification link.");
                        toast.error("Email verification required");
                        return;
                    }

                    toast.success("Welcome back!");
                    router.push("/");
                    router.refresh();
                }
            } else {
                // Sign Up - validate username
                if (!username.trim()) {
                    setError("Username is required");
                    setIsLoading(false);
                    return;
                }

                if (username.length < 3) {
                    setError("Username must be at least 3 characters");
                    setIsLoading(false);
                    return;
                }

                // Validate email (check format and block disposable emails)
                const emailValidation = validateEmail(email);
                if (!emailValidation.valid) {
                    setError(emailValidation.error || "Invalid email");
                    toast.error(emailValidation.error || "Invalid email");
                    setIsLoading(false);
                    return;
                }

                // Check if username is taken
                const { data: existingUser } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("username", username.toLowerCase())
                    .single();

                if (existingUser) {
                    setError("Username is already taken");
                    toast.error("Username is already taken");
                    setIsLoading(false);
                    return;
                }

                // Create account with email confirmation required
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username.toLowerCase(),
                        },
                        emailRedirectTo: `${window.location.origin}/login?verified=true`,
                    },
                });

                if (signUpError) {
                    setError(signUpError.message);
                    toast.error(signUpError.message);
                } else if (data.user) {
                    // Check if email confirmation is pending
                    if (data.user.identities && data.user.identities.length === 0) {
                        // User already exists but not confirmed
                        setError("An account with this email already exists. Please check your email for verification link.");
                        toast.error("Account exists - check your email to verify");
                    } else {
                        setSuccess("Account created! Please check your email to verify before logging in.");
                        toast.success("Check your email to verify your account!");
                    }
                }
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            toast.error("An unexpected error occurred");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail.trim()) {
            toast.error("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/login`,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Password reset link sent! Check your email.");
                setShowForgotPassword(false);
                setResetEmail("");
            }
        } catch (err) {
            toast.error("Failed to send reset email");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Decorative Background Orbs */}
            <div className="orb orb-violet w-[500px] h-[500px] -top-48 -left-48 opacity-50 animate-float" />
            <div className="orb orb-cyan w-[400px] h-[400px] top-1/2 -right-32 opacity-40 animate-float-delayed" />
            <div className="orb orb-pink w-[450px] h-[450px] -bottom-32 left-1/4 opacity-35 animate-float" />

            {/* Back Link */}
            <Link href="/" className="absolute top-4 left-4 md:top-8 md:left-8 z-10">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-2026 p-3 rounded-xl glow-on-hover"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
            </Link>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotPassword && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowForgotPassword(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-strong-2026 rounded-2xl p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-white">Reset Password</h3>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <p className="text-sm text-zinc-400 mb-6">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="gradient-button w-full py-3 rounded-xl font-semibold disabled:opacity-50"
                                >
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-500/30">
                            <Image
                                src="/logo.png"
                                alt="GameTale"
                                width={48}
                                height={48}
                                className="object-cover"
                                priority
                            />
                        </div>
                        <span className="text-2xl font-bold gradient-text-animated">GameTale</span>
                    </motion.div>
                </div>

                {/* Card */}
                <div className="glass-strong-2026 rounded-2xl p-8">
                    {/* Toggle */}
                    <div className="flex gap-2 mb-8 p-1 bg-zinc-800/50 rounded-xl">
                        <button
                            onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isLogin
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isLogin
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <AnimatePresence mode="wait">
                        <motion.form
                            key={isLogin ? "login" : "signup"}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <h2 className="text-xl font-semibold text-white mb-6">
                                {isLogin ? "Welcome back" : "Create your account"}
                            </h2>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400"
                                >
                                    {success}
                                </motion.div>
                            )}

                            {/* Username (Sign Up only) */}
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="text-sm text-zinc-400">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                                            placeholder="coolplayer123"
                                            required={!isLogin}
                                            minLength={3}
                                            maxLength={20}
                                            className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500">Letters, numbers, and underscores only</p>
                                </motion.div>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-12 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {!isLogin && (
                                    <p className="text-xs text-zinc-500">Must be at least 6 characters</p>
                                )}
                            </div>

                            {/* Forgot Password */}
                            {isLogin && (
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-blue-400 hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={isLoading}
                                className="gradient-button w-full py-3.5 rounded-xl font-semibold disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        Processing...
                                    </span>
                                ) : isLogin ? (
                                    "Sign In"
                                ) : (
                                    "Create Account"
                                )}
                            </motion.button>
                        </motion.form>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-500 mt-6">
                    By continuing, you agree to our{" "}
                    <a href="#" className="text-blue-400 hover:underline">Terms</a>
                    {" "}and{" "}
                    <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
                </p>
            </motion.div>
        </main>
    );
}

