'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UtensilsCrossed, Loader2, CheckCircle2 } from 'lucide-react'
import { login, signup } from '@/app/auth/actions'
import { toast } from 'sonner'
import { useLocale } from '@/lib/locale-context'
import { createClient } from '@/lib/supabase/client'
import { GoogleIcon } from '@/components/icons/google-icon'

type AuthResult = { error?: string; success?: boolean; message?: string } | void;

export default function LoginPage() {
  const { t, locale } = useLocale();
  const authT = (key: string) => t(`auth.${key}`);

  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?lang=${locale}`,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
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
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? authT('signUpButton') : authT('signInButton')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-zinc-200"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            {authT('googleSignIn')}
          </Button>

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
