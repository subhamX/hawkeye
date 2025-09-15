'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Eye,
  Shield,
  BarChart3,
  Zap,
  Cloud,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroHeader } from './header';
import { motion } from 'motion/react';

// Simple animation components
const FadeIn = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

const TextEffect = ({
  children,
  delay = 0,
  className = '',
}: {
  children: string;
  delay?: number;
  className?: string;
}) => {
  const words = children.split(' ');
  return (
    <div className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.05,
            ease: 'easeOut',
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const HoverCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

const FloatingParticles = ({ count = 20 }: { count?: number }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden relative">
        <FloatingParticles count={30} />
        <div aria-hidden className="absolute inset-0 isolate opacity-40">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 2,
                delay: 1,
                type: 'spring',
                bounce: 0.3,
              }}
              className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
            >
              <img
                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                alt="background"
                className="hidden size-full dark:block"
                width="3276"
                height="4095"
              />
            </motion.div>

            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
            />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <FadeIn delay={0.2}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href="/dashboard"
                      className="hover:bg-background/80 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 group mx-auto flex w-fit items-center gap-4 rounded-full border border-blue-200/50 dark:border-blue-800/50 p-1 pl-4 shadow-lg backdrop-blur-sm transition-all duration-300"
                    >
                      <span className="text-foreground text-sm font-medium">
                        🚀 Advanced AWS Infrastructure Monitoring
                      </span>
                      <span className="dark:border-background block h-4 w-0.5 border-l bg-blue-300 dark:bg-blue-700"></span>

                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 group-hover:from-blue-600 group-hover:to-purple-600 size-6 overflow-hidden rounded-full duration-500">
                        <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                          <span className="flex size-6">
                            <ArrowRight className="m-auto size-3 text-white" />
                          </span>
                          <span className="flex size-6">
                            <ArrowRight className="m-auto size-3 text-white" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </FadeIn>

                <TextEffect
                  delay={0.3}
                  className="mx-auto mt-8 max-w-5xl text-balance text-5xl font-bold max-md:font-bold md:text-7xl lg:mt-16 xl:text-[5.25rem] bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent"
                >
                  AWS Infrastructure Monitoring Made Simple
                </TextEffect>
                <TextEffect
                  delay={0.8}
                  className="mx-auto mt-8 max-w-3xl text-balance text-xl text-muted-foreground leading-relaxed"
                >
                  Monitor, analyze, and optimize your AWS infrastructure with
                  intelligent insights, real-time alerts, and comprehensive
                  security analysis. Get complete visibility into your cloud
                  resources.
                </TextEffect>

                <FadeIn
                  delay={1.2}
                  className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-0.5 shadow-lg"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl px-8 py-6 text-base font-semibold text-white border-0"
                    >
                      <Link href="/dashboard">
                        <Eye className="mr-2 size-5" />
                        <span className="text-nowrap">Start Monitoring</span>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-xl px-8 py-6 text-base font-semibold border-2 hover:bg-muted/50"
                    >
                      <Link href="/demo">
                        <BarChart3 className="mr-2 size-5" />
                        <span className="text-nowrap">View Demo</span>
                      </Link>
                    </Button>
                  </motion.div>
                </FadeIn>
              </div>
            </div>

            <FadeIn
              delay={1.5}
              className="relative mt-16 overflow-hidden px-2 sm:mr-0 sm:mt-20 md:mt-24"
            >
              <motion.div
                className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-background/80 to-muted/30 p-2 shadow-2xl backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="aspect-video relative rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-8 overflow-hidden">
                  {/* Dashboard Preview Mockup */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    <motion.div
                      className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm border border-white/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.8 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="size-5 text-green-500" />
                        <span className="font-semibold text-sm">
                          Security Status
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 1, delay: 2 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          85% Secure
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm border border-white/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 2.0 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="size-5 text-yellow-500" />
                        <span className="font-semibold text-sm">
                          Performance
                        </span>
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
                            transition={{ duration: 1, delay: 2.2 }}
                          />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm border border-white/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 2.2 }}
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

                  {/* Floating elements */}
                  <motion.div
                    className="absolute top-4 right-4 bg-blue-500 rounded-full p-2"
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Eye className="size-4 text-white" />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-4 left-4 bg-purple-500 rounded-full p-2"
                    animate={{
                      y: [0, 10, 0],
                      rotate: [0, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1,
                    }}
                  >
                    <Lock className="size-4 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="mx-auto max-w-7xl px-6">
            <FadeIn delay={0.2}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Everything you need to monitor AWS
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Comprehensive monitoring, security analysis, and optimization
                  tools for your AWS infrastructure
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Eye,
                  title: 'Real-time Monitoring',
                  description:
                    'Monitor your AWS resources in real-time with detailed metrics and alerts',
                  color: 'blue',
                },
                {
                  icon: Shield,
                  title: 'Security Analysis',
                  description:
                    'Comprehensive security scanning and vulnerability assessment for your infrastructure',
                  color: 'green',
                },
                {
                  icon: BarChart3,
                  title: 'Performance Analytics',
                  description:
                    'Deep insights into performance metrics with intelligent recommendations',
                  color: 'purple',
                },
                {
                  icon: Zap,
                  title: 'Cost Optimization',
                  description:
                    'Identify cost-saving opportunities and optimize your AWS spending',
                  color: 'yellow',
                },
                {
                  icon: Cloud,
                  title: 'Multi-Region Support',
                  description:
                    'Monitor resources across all AWS regions from a single dashboard',
                  color: 'cyan',
                },
                {
                  icon: Lock,
                  title: 'Compliance Tracking',
                  description:
                    'Ensure compliance with industry standards and best practices',
                  color: 'red',
                },
              ].map((feature, index) => (
                <FadeIn key={index} delay={0.4 + index * 0.1}>
                  <HoverCard className="h-full">
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 h-full">
                      <div
                        className={`inline-flex p-3 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/20 mb-4`}
                      >
                        <feature.icon
                          className={`size-6 text-${feature.color}-600 dark:text-${feature.color}-400`}
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </HoverCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn delay={0.2}>
              <div className="text-center mb-12">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
                  Trusted by teams at
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60 hover:opacity-100 transition-opacity duration-300">
              {[
                { name: 'AWS', logo: '🔶' },
                { name: 'Microsoft', logo: '🪟' },
                { name: 'Google', logo: '🔍' },
                { name: 'Meta', logo: '📘' },
                { name: 'Netflix', logo: '🎬' },
                { name: 'Spotify', logo: '🎵' },
                { name: 'Uber', logo: '🚗' },
                { name: 'Airbnb', logo: '🏠' },
              ].map((company, index) => (
                <FadeIn key={index} delay={0.4 + index * 0.05}>
                  <motion.div
                    className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-muted/50 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-3xl mb-2">{company.logo}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {company.name}
                    </span>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
