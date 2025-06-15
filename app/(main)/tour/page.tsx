"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { ChevronRight, ChevronLeft, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/context/UserContext"
import confetti from "canvas-confetti";

const tourSteps = [
  {
    title: "Welcome to GrowBro AI",
    description: "Let's take a quick tour to help you get the most out of your AI assistant.",
    image: "/dashboard.png", // TODO: Replace with real screenshot
    content: (user) => `GrowBro AI is a powerful customer relationship management tool that helps you engage with visitors, capture leads, and grow your business. ${user?.name ? `Welcome, ${user.name}!` : ''}`
  },
  {
    title: "Set up your AI assistant",
    description: "Configure your AI assistant to reflect your business.",
    image: "/info.png", // TODO: Replace with real screenshot
    content: (user) => `Start by entering your business information, including company name, website, and contact details. This helps your AI provide accurate information to your customers.${user?.company ? ` Your company: ${user.company}` : ''}`,
    action: {
      label: "Go to Business Info",
      href: "/dashboard/info"
    }
  },
  {
    title: "Train your AI",
    description: "Help your AI learn about your business.",
    image: "/resources.png", // TODO: Replace with real screenshot
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
      label: "Go to Customize page",
      href: "/customize"
    }
  },
  {
    title: "Embed on your website",
    description: "Add your AI assistant to your website.",
    image: "/embed.png", // TODO: Replace with real screenshot
    content: () => "Get the embed code and add it to your website to start engaging with visitors and capturing leads.",
    action: {
      label: "Get Embed Code",
      href: "/ai-code"
    }
  }
]

export default function TourPage() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentStep < tourSteps.length - 1) handleNext();
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) handlePrevious();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  // Swipe gesture navigation
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.changedTouches[0].clientX;
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const dx = touchEndX.current - touchStartX.current;
      if (dx > 40 && currentStep > 0) handlePrevious(); // Swipe right
      else if (dx < -40 && currentStep < tourSteps.length - 1) handleNext(); // Swipe left
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Confetti on completion
  useEffect(() => {
    if (feedbackSubmitted && currentStep === tourSteps.length - 1) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    }
  }, [feedbackSubmitted, currentStep]);

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
              <Card className="mb-8 overflow-visible shadow-2xl rounded-2xl border-0 bg-white">
                {/* Animated Progress Bar */}
                <div className="w-full max-w-xl mx-auto mb-6">
                  <motion.div
                    className="h-2 rounded-full bg-gray-200 overflow-hidden"
                  >
                    <motion.div
                      className="h-2 rounded-full bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
                      aria-label={`Step ${currentStep + 1} of ${tourSteps.length}`}
                    />
                  </motion.div>
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.5 }}
                    tabIndex={0}
                    aria-label="Expand image"
                    onClick={() => setLightboxOpen(true)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true); }}
                  />
                </div>
                <CardContent className="p-8 text-center flex flex-col items-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">{currentTourStep.title}</h2>
                  <p className="text-base text-gray-600 mb-2">{currentTourStep.description}</p>
                  <div className="text-lg text-gray-700 mb-4">
                    {typeof currentTourStep.content === "function" ? currentTourStep.content(user) : currentTourStep.content}
                  </div>
                  {currentTourStep.action && (
                    <Button
                      className="mt-4 text-base px-6 py-2"
                      variant="default"
                      onClick={() => handleGoToFeature(currentTourStep.action.href)}
                      aria-label={currentTourStep.action.label}
                    >
                      {currentTourStep.action.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
              {/* Lightbox Modal for Image Zoom */}
              {lightboxOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
                  onClick={() => setLightboxOpen(false)}
                  tabIndex={-1}
                  aria-modal="true"
                  role="dialog"
                >
                  <motion.img
                    src={currentTourStep.image}
                    alt={currentTourStep.title}
                    className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl border-4 border-white"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.3 }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    className="absolute top-8 right-8 text-white bg-black bg-opacity-40 rounded-full p-2 hover:bg-opacity-70 transition"
                    onClick={() => setLightboxOpen(false)}
                    aria-label="Close image preview"
                  >
                    ×
                  </button>
                </div>
              )}
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