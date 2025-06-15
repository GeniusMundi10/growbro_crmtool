"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { ChevronRight, ChevronLeft, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/context/UserContext"

const tourSteps = [
  {
    title: "Welcome to GrowBro AI",
    description: "Let's take a quick tour to help you get the most out of your AI assistant.",
    image: "/dashboard-overview.png", // TODO: Replace with real screenshot
    content: (user) => `GrowBro AI is a powerful customer relationship management tool that helps you engage with visitors, capture leads, and grow your business. ${user?.name ? `Welcome, ${user.name}!` : ''}`
  },
  {
    title: "Set up your AI assistant",
    description: "Configure your AI assistant to reflect your business.",
    image: "/business-info.png", // TODO: Replace with real screenshot
    content: (user) => `Start by entering your business information, including company name, website, and contact details. This helps your AI provide accurate information to your customers.${user?.company ? ` Your company: ${user.company}` : ''}`,
    action: {
      label: "Go to Business Info",
      href: "/dashboard/info"
    }
  },
  {
    title: "Train your AI",
    description: "Help your AI learn about your business.",
    image: "/training.png", // TODO: Replace with real screenshot
    content: () => "Upload files, add your website, and provide resources to train your AI assistant. The more information you provide, the better your AI will understand your business.",
    action: {
      label: "Go to Resources",
      href: "/dashboard/resource-links"
    }
  },
  {
    title: "Customize your AI",
    description: "Make your AI assistant match your brand.",
    image: "/customize.png", // TODO: Replace with real screenshot
    content: () => "Customize the appearance, behavior, and voice of your AI assistant to create a seamless experience for your visitors.",
    action: {
      label: "Go to Voice Settings",
      href: "/dashboard/voice"
    }
  },
  {
    title: "Embed on your website",
    description: "Add your AI assistant to your website.",
    image: "/embed-code.png", // TODO: Replace with real screenshot
    content: () => "Get the embed code and add it to your website to start engaging with visitors and capturing leads.",
    action: {
      label: "Get Embed Code",
      href: "/ai-code/embed-code"
    }
  }
]

export default function TourPage() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const savedStep = localStorage.getItem("tourStep");
    if (savedStep) setCurrentStep(Number(savedStep));
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem("tourStep", String(currentStep));
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("tourSkipped", "1");
    window.location.href = "/dashboard";
  };

  const handleGoToFeature = (href) => {
    window.location.href = href;
  };

  const handleFeedback = (value) => {
    setFeedback(value);
    setFeedbackSubmitted(true);
    // TODO: Send feedback to backend or Supabase
  };

  const currentTourStep = tourSteps[currentStep];

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

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="mb-8 overflow-hidden">
                <div className="bg-gray-100 h-64 flex items-center justify-center border-b">
                  {/* TODO: Replace with real image */}
                  <img
                    src={currentTourStep.image}
                    alt={currentTourStep.title}
                    className="h-56 object-contain mx-auto"
                  />
                </div>
                <CardContent className="p-6">
                  <p>{typeof currentTourStep.content === "function" ? currentTourStep.content(user) : currentTourStep.content}</p>
                  {currentTourStep.action && (
                    <Button
                      className="mt-6"
                      variant="outline"
                      onClick={() => handleGoToFeature(currentTourStep.action.href)}
                    >
                      {currentTourStep.action.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

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
                <motion.div
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === currentStep ? "bg-green-600" : "bg-gray-300"}`}
                  animate={{ scale: index === currentStep ? 1.4 : 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
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

          {/* Feedback prompt on last step */}
          {currentStep === tourSteps.length - 1 && !feedbackSubmitted && (
            <div className="mt-10 flex flex-col items-center">
              <div className="mb-2 font-medium">Was this tour helpful?</div>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => handleFeedback("yes")}>
                  <ThumbsUp className="h-5 w-5 mr-1 text-green-600" /> Yes
                </Button>
                <Button variant="outline" onClick={() => handleFeedback("no")}> 
                  <ThumbsDown className="h-5 w-5 mr-1 text-red-500" /> No
                </Button>
              </div>
            </div>
          )}
          {feedbackSubmitted && (
            <div className="mt-10 text-center text-green-700 font-semibold">Thank you for your feedback!</div>
          )}
        </div>
      </div>
    </div>
  );
}