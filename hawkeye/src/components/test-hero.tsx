'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

// Simple test component to verify everything works
export default function TestHero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hawkeye Test Page
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Testing the UI improvements and animations
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Link href="/dashboard">
                  <Eye className="mr-2 size-5" />
                  Start Monitoring
                </Link>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" variant="outline">
                <Link href="/demo">
                  <BarChart3 className="mr-2 size-5" />
                  View Demo
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Eye, title: "Real-time Monitoring", color: "blue" },
              { icon: Shield, title: "Security Analysis", color: "green" },
              { icon: BarChart3, title: "Performance Analytics", color: "purple" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className={`inline-flex p-3 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/20 mb-4`}>
                  <feature.icon className={`size-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}