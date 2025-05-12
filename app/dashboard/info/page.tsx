"use client"

import { motion } from "framer-motion"
import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import BusinessInfoForm from "./business-info-form"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

export default function BusinessInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header title="Dashboard" />
      <motion.div 
        className="container mx-auto px-4 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold mb-6 text-slate-800">Welcome to GrowBro.ai</h1>
          <p className="text-slate-600 mb-8">
            Configure your AI assistant to match your business needs. Start by filling out the business information below.
          </p>
          <DashboardTabs activeTab="info" />
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="mt-8"
        >
          <BusinessInfoForm />
        </motion.div>
      </motion.div>
    </div>
  )
}
