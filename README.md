# GrowBro.ai - AI-Powered CRM Platform

GrowBro.ai is a powerful AI-driven CRM platform designed to help businesses automate sales processes, capture leads, and provide exceptional customer service through intelligent chatbots. This platform is built with modern web technologies and integrates seamlessly with AI services.

![GrowBro.ai Dashboard](public/dashboard-preview.png)

## Features

- **AI-Powered Chat Assistant**: Engage with visitors using a sophisticated AI chatbot that can answer questions, qualify leads, and schedule appointments.
- **Lead Management**: Capture, organize, and track leads automatically from chat conversations.
- **Business Customization**: Configure your AI assistant with your business information, branding, and knowledge base.
- **Analytics Dashboard**: Track conversations, lead generation, and conversion metrics with detailed visualizations.
- **Team Collaboration**: Invite team members and collaborate on lead nurturing and customer engagement.
- **Resource Management**: Upload files, websites, and links to train your AI on your business offerings.
- **Supabase Integration**: Full-stack application with Supabase for authentication, database, storage, and realtime features.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **State Management**: React Hooks
- **Charts**: Recharts
- **AI Integration**: OpenAI API

## Getting Started

Follow these steps to set up the GrowBro.ai CRM platform locally:

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm
- Supabase account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/growbro-ai-crm.git
   cd growbro-ai-crm
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase and OpenAI credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. Set up your Supabase database by running the SQL schema in `supabase/schema.sql` in your Supabase SQL editor.

5. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utility functions and Supabase clients
- `/public` - Static assets
- `/styles` - Global CSS and Tailwind configuration

## Deployment

### Deploy on Vercel

The easiest way to deploy your GrowBro.ai application is to use the [Vercel Platform](https://vercel.com):

```bash
npm install -g vercel
vercel
```

### Self-hosting

You can also deploy GrowBro.ai on any platform that supports Node.js applications:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Database Schema

The Supabase database includes the following tables:

- `users` - User authentication and profiles
- `business_info` - Business details and AI configuration
- `conversations` - Chat conversations with visitors
- `chat_messages` - Individual messages within conversations
- `leads` - Sales leads captured from conversations
- `resources` - Files, websites, and links for AI training
- `analytics` - User activity and performance metrics
- `team_members` - Team collaboration and access control

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Inspired by VengoAI's UX/UI design and feature set
- Built with [Next.js](https://nextjs.org/) and [Supabase](https://supabase.io/)
- UI components from [shadcn/ui](https://ui.shadcn.com/) 