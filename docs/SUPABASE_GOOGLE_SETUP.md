# Setting Up Google OAuth for GrowBro.ai

This guide will walk you through the process of setting up Google OAuth authentication for your GrowBro.ai application using Supabase.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select "New Project"
3. Give your project a name (e.g., "GrowBro.ai") and click "Create"
4. Once created, make sure your new project is selected in the project dropdown

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type and click "Create"
3. Fill in the required information:
   - App name: "GrowBro.ai"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Click "Save and Continue"
5. Skip the "Scopes" section by clicking "Save and Continue"
6. Add any test users if needed (your email address), then click "Save and Continue"
7. Review your settings and click "Back to Dashboard"

## Step 3: Create OAuth Credentials

1. Still in "APIs & Services", navigate to "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. For Application type, select "Web application"
4. Name: "GrowBro.ai Web Client"
5. Under "Authorized JavaScript origins", add:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com` (your actual domain)
6. Under "Authorized redirect URIs", add:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback` 
   
   **IMPORTANT**: Also add your Supabase auth callback URL, which should look like:
   - `https://[PROJECT_ID].supabase.co/auth/v1/callback`
   - Get this URL from your Supabase dashboard → Authentication → URL Configuration

7. Click "Create"
8. Take note of the "Client ID" and "Client Secret" that are generated

## Step 4: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project for GrowBro.ai
3. Navigate to "Authentication" → "Providers"
4. Find "Google" in the list of providers and click on it
5. Toggle it to "Enabled"
6. Enter the "Client ID" and "Client Secret" from Step 3
7. Leave the default scopes as they are (`https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`)
8. Click "Save"

## Step 5: Configure Redirect URLs in Supabase

1. In your Supabase Dashboard, go to "Authentication" → "URL Configuration"
2. Make sure your Site URL is set correctly:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. Add the following to Redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
4. Click "Save"

## Step 6: Test Your Setup

1. Run your application locally or deploy it to production
2. Go to the sign-in page and click "Sign in with Google"
3. Follow the Google sign-in flow
4. You should be redirected back to your application and signed in automatically

## Troubleshooting

If you encounter issues:

1. **Redirect URI Mismatch**: Make sure the redirect URIs in Google Cloud Console exactly match those in your code and Supabase settings
2. **API Errors**: Enable the Google+ API or People API in your Google Cloud project
3. **Email Verification**: By default, Supabase requires email verification. You can change this in Authentication → Settings
4. **CORS Issues**: Ensure your Site URL in Supabase matches your application's URL
5. **Callback Errors**: Check that your `/auth/callback` route handler is correctly implemented

For more help, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2) 