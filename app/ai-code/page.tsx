import Header from "@/components/header"
import EmbedCode from "./embed-code"

export default function AiCodePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Get AI Code & Test AI" />
      <div className="container mx-auto px-4 py-6">
        <EmbedCode />
      </div>
    </div>
  )
}
