// frontend/src/pages/auth/LoginPage.tsx
// The single login page for BOTH students and staff. The only difference after a
// successful login is where the redirect sends them, based on user.role.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { LogoMark } from '@/components/Brand';
import { useLogin } from '@/hooks/useAuth';
import { isAdminRole, useAuthStore } from '@/store/auth.store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  // Already signed in? Bounce to the right portal. A declarative <Navigate> is used
  // instead of calling navigate() during render - calling the imperative navigate()
  // synchronously mid-render can collide with this component's own render pass
  // (e.g. right after the Zustand auth store updates) and throw an uncaught error,
  // which - with no error boundary in the tree - unmounts the whole app to a blank
  // screen. <Navigate> lets React Router handle the redirect safely as a render output.
  if (isAuthenticated && user) {
    return <Navigate to={isAdminRole(user.role) ? '/admin' : '/student'} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setLocked(false);
    try {
      const data = await login.mutateAsync(values);
      navigate(isAdminRole(data.user.role) ? '/admin' : '/student', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setLocked(true);
      } else {
        // Generic message - never reveal which field was wrong.
        setFormError('Incorrect email or password');
      }
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-[380px] rounded-card border border-border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="mb-3 h-11 w-11" />
          <h1 className="text-lg font-medium text-text-primary">University Library</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to your account</p>
        </div>

        {locked && (
          <div className="mb-4 flex items-start gap-2 rounded-control border border-warning-bg bg-warning-bg px-3 py-2.5 text-xs text-warning-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Too many attempts. Try again in 15 minutes.</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              icon={<Mail className="h-4 w-4" />}
              invalid={!!errors.email}
              {...register('email')}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                invalid={!!errors.password}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-secondary hover:text-text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {formError && (
            <p className="text-center text-xs text-error-text" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" loading={login.isPending}>
            Sign in
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
