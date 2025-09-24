import Header from "@/components/header"
import EmbedCode from "./embed-code"

export default function AiCodePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Get AI Code & Test AI" 
        description="Copy and paste following script to your website HTML. Customize your chatbot appearance and behavior to match your brand."
        showTitleInHeader={false} 
      />
      <div className="container mx-auto px-4 py-6">
        <EmbedCode />
      </div>
    </div>
  )
}
