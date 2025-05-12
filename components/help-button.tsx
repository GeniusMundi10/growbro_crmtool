import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function HelpButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-green-500 cursor-pointer">
            <HelpCircle className="h-5 w-5 mr-1" />
            <span>Help</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="w-80">Need help with this section? Click for more information.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
