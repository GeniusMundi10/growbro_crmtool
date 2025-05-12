"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react"

const tourSteps = [
  {
    title: "Welcome to GrowBro AI",
    description: "Let's take a quick tour to help you get the most out of your AI assistant.",
    image: "/dashboard-overview.png", // Placeholder image path
    content: "GrowBro AI is a powerful customer relationship management tool that helps you engage with visitors, capture leads, and grow your business."
  },
  {
    title: "Set up your AI assistant",
    description: "Configure your AI assistant to reflect your business.",
    image: "/business-info.png", // Placeholder image path
    content: "Start by entering your business information, including company name, website, and contact details. This helps your AI provide accurate information to your customers."
  },
  {
    title: "Train your AI",
    description: "Help your AI learn about your business.",
    image: "/training.png", // Placeholder image path
    content: "Upload files, add your website, and provide resources to train your AI assistant. The more information you provide, the better your AI will understand your business."
  },
  {
    title: "Customize your AI",
    description: "Make your AI assistant match your brand.",
    image: "/customize.png", // Placeholder image path
    content: "Customize the appearance, behavior, and voice of your AI assistant to create a seamless experience for your visitors."
  },
  {
    title: "Embed on your website",
    description: "Add your AI assistant to your website.",
    image: "/embed-code.png", // Placeholder image path
    content: "Get the embed code and add it to your website to start engaging with visitors and capturing leads."
  }
]

export default function TourPage() {
  const [currentStep, setCurrentStep] = useState(0)
  
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSkip = () => {
    window.location.href = "/dashboard"
  }
  
  const currentTourStep = tourSteps[currentStep]
  
  return (
    <div className="min-h-screen bg-white">
      <Header title="Product Tour" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{currentTourStep.title}</h1>
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {tourSteps.length}
              </div>
            </div>
            <p className="text-gray-600">{currentTourStep.description}</p>
          </div>
          
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gray-100 h-64 flex items-center justify-center border-b">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-2">🖼️</div>
                <p>Image placeholder: {currentTourStep.image}</p>
              </div>
            </div>
            <CardContent className="p-6">
              <p>{currentTourStep.content}</p>
            </CardContent>
          </Card>
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            
            <div className="space-x-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              
              {currentStep < tourSteps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSkip} className="bg-green-600 hover:bg-green-700">
                  Get Started
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 