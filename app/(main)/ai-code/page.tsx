import Header from "@/components/header"
import EmbedCode from "./embed-code"

export default function AiCodePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Install & Test Your AI Assistant" 
        description="Add GrowBro to your site in minutes. Copy a single script for a floating widget or use an inline iframe. Instantly preview and test the experience—no deploys needed."
        showTitleInHeader={false} 
      />
      <div className="container mx-auto px-4 py-8">
        <EmbedCode />
      </div>
    </div>
  )
}
