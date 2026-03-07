'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UtensilsCrossed, Loader2, CheckCircle2 } from 'lucide-react'
import { login, signup } from '@/app/auth/actions'
import { toast } from 'sonner'
import { useLocale } from '@/lib/locale-context'
import { createClient } from '@/lib/supabase/client'

type AuthResult = { error?: string; success?: boolean; message?: string } | void;

function LoginContent() {
  const { t, locale } = useLocale();
  const authT = (key: string) => t(`auth.${key}`);
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setSuccessMessage(null);

    // Add locale to formData
    formData.append('locale', locale);

    const action = (isSignUp ? signup : login) as (data: FormData) => Promise<AuthResult>;
    const result = await action(formData);

    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else if (result && 'success' in result && result.success && result.message) {
      setSuccessMessage(result.message);
      setIsLoading(false);
      setIsSignUp(false); // Switch to login view
      toast.success(result.message);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?lang=${locale}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
      // If successful, user gets redirected — no need to set loading false
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate Google login');
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 pt-20">
      <Card className="w-full max-w-sm shadow-xl border-zinc-200">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? authT('signUp') : authT('signIn')}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? authT('noAccount')
              : authT('haveAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 h-11 font-medium"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {authT('continueWithGoogle')}
          </Button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">{authT('orContinueWith')}</span>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-4">

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="full_name">{authT('fullName')}</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="John Doe"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{authT('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{authT('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-tablo-red-600 text-white"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? authT('signUpButton') : authT('signInButton')}
            </Button>
          </form>


          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? authT('haveAccount') : authT('noAccount')}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setSuccessMessage(null);
              }}
              className="text-primary hover:underline font-medium ml-1"
              type="button"
            >
              {isSignUp ? authT('signIn') : authT('signUp')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
