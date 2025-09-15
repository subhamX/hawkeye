'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, Shield, BarChart3, Zap, Cloud, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroHeader } from './header';
import { motion } from 'motion/react';

export default function HeroSectionSimple() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10" />
        
        {/* Hero Content */}
        <section className="relative pt-24 md:pt-36 pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              {/* Announcement Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-4 rounded-full border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-1 pl-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <span className="text-sm font-medium">
                    🚀 Advanced AWS Infrastructure Monitoring
                  </span>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 size-6 rounded-full flex items-center justify-center">
                    <ArrowRight className="size-3 text-white" />
                  </div>
                </Link>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mx-auto max-w-5xl text-balance text-5xl font-bold md:text-7xl xl:text-[5.25rem] gradient-text"
              >
                AWS Infrastructure Monitoring Made Simple
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mx-auto mt-8 max-w-3xl text-balance text-xl text-secondary leading-relaxed"
              >
                Monitor, analyze, and optimize your AWS infrastructure with intelligent insights, 
                real-time alerts, and comprehensive security analysis. Get complete visibility into your cloud resources.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    className="btn-gradient rounded-xl px-8 py-6 text-base font-semibold"
                  >
                    <Link href="/dashboard">
                      <Eye className="mr-2 size-5" />
                      Start Monitoring
                    </Link>
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-8 py-6 text-base font-semibold border-2 hover:bg-muted/50"
                  >
                    <Link href="/demo">
                      <BarChart3 className="mr-2 size-5" />
                      View Demo
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="relative mt-16 overflow-hidden px-2 sm:mt-20 md:mt-24"
            >
              <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-background/80 to-muted/30 p-2 shadow-2xl backdrop-blur-sm">
                <div className="aspect-video relative rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-8 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {/* Security Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      className="glass-effect rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="size-5 text-green-500" />
                        <span className="font-semibold text-sm">Security Status</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 1, delay: 1.5 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">85% Secure</p>
                      </div>
                    </motion.div>

                    {/* Performance Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                      className="glass-effect rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="size-5 text-yellow-500" />
                        <span className="font-semibold text-sm">Performance</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>CPU</span>
                          <span>45%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-yellow-500"
                            initial={{ width: 0 }}
                            animate={{ width: '45%' }}
                            transition={{ duration: 1, delay: 1.7 }}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Resources Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.6 }}
                      className="glass-effect rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Cloud className="size-5 text-blue-500" />
                        <span className="font-semibold text-sm">Resources</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>EC2: 12 instances</p>
                        <p>S3: 8 buckets</p>
                        <p>RDS: 3 databases</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Floating Icons */}
                  <motion.div
                    className="absolute top-4 right-4 bg-blue-500 rounded-full p-2"
                    animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Eye className="size-4 text-white" />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-4 left-4 bg-purple-500 rounded-full p-2"
                    animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  >
                    <Lock className="size-4 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4 gradient-text">
                Everything you need to monitor AWS
              </h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Comprehensive monitoring, security analysis, and optimization tools for your AWS infrastructure
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Eye,
                  title: 'Real-time Monitoring',
                  description: 'Monitor your AWS resources in real-time with detailed metrics and alerts',
                  color: 'blue',
                },
                {
                  icon: Shield,
                  title: 'Security Analysis',
                  description: 'Comprehensive security scanning and vulnerability assessment for your infrastructure',
                  color: 'green',
                },
                {
                  icon: BarChart3,
                  title: 'Performance Analytics',
                  description: 'Deep insights into performance metrics with intelligent recommendations',
                  color: 'purple',
                },
                {
                  icon: Zap,
                  title: 'Cost Optimization',
                  description: 'Identify cost-saving opportunities and optimize your AWS spending',
                  color: 'yellow',
                },
                {
                  icon: Cloud,
                  title: 'Multi-Region Support',
                  description: 'Monitor resources across all AWS regions from a single dashboard',
                  color: 'cyan',
                },
                {
                  icon: Lock,
                  title: 'Compliance Tracking',
                  description: 'Ensure compliance with industry standards and best practices',
                  color: 'red',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="h-full"
                >
                  <div className="card-modern p-6 h-full">
                    <div className="inline-flex p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 mb-4">
                      <feature.icon className="size-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}