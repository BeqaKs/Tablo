'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const defaultLocale = 'ka'

export async function login(formData: FormData) {
    const supabase = await createClient()
    // We still accept locale in case we need it for logging or future server-side translation
    const locale = formData.get('locale') as string || defaultLocale

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    // Get user role to determine redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        revalidatePath('/', 'layout')

        // Redirect based on role (no locale prefix anymore)
        if (profile?.role === 'admin') {
            redirect(`/dashboard/admin`)
        } else if (profile?.role === 'restaurant_owner') {
            redirect(`/dashboard`)
        } else {
            redirect(`/restaurants`)
        }
    }

    revalidatePath('/', 'layout')
    redirect(`/restaurants`)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const locale = formData.get('locale') as string || defaultLocale

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            // Email redirect includes locale for client-side persistence if needed
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?lang=${locale}`,
        },
    })

    if (signUpError) {
        return { error: signUpError.message }
    }

    if (!authData.user) {
        return { error: 'Failed to create user account' }
    }

    // Create user profile in the database
    const { error: profileError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: 'customer', // Default role for public signups
        })

    if (profileError) {
        console.error('Profile creation error:', profileError)
    }

    // Check if email confirmation is required
    if (authData.session) {
        // User is automatically logged in
        revalidatePath('/', 'layout')
        redirect(`/restaurants`)
    } else {
        // Email confirmation required
        return {
            success: true,
            message: locale === 'ka'
                ? 'გთხოვთ შეამოწმოთ თქვენი ელ-ფოსტა ანგარიშის გასააქტიურებლად.'
                : 'Please check your email to confirm your account before signing in.'
        }
    }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect(`/`)
}
