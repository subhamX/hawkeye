import { FadeIn, HoverCard } from '@/components/motion-primitives'
import { Button } from '@/components/ui/button'
import { Eye, Shield, BarChart3, Zap, Cloud, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-12">
        <FadeIn>
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                <ArrowLeft className="mr-2 size-4" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-4xl font-bold mb-4 gradient-text">
              Hawkeye Demo Dashboard
            </h1>
            <p className="text-lg text-secondary">
              Experience the power of AWS infrastructure monitoring
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Eye,
              title: "Active Monitoring",
              value: "24/7",
              description: "Continuous infrastructure monitoring",
              color: "blue"
            },
            {
              icon: Shield,
              title: "Security Score",
              value: "94%",
              description: "Overall security compliance",
              color: "green"
            },
            {
              icon: BarChart3,
              title: "Cost Savings",
              value: "$12,450",
              description: "Monthly optimization savings",
              color: "purple"
            },
            {
              icon: Zap,
              title: "Performance",
              value: "99.9%",
              description: "System uptime this month",
              color: "yellow"
            },
            {
              icon: Cloud,
              title: "Resources",
              value: "156",
              description: "Total AWS resources monitored",
              color: "cyan"
            },
            {
              icon: Lock,
              title: "Compliance",
              value: "SOC 2",
              description: "Industry standard compliance",
              color: "red"
            }
          ].map((metric, index) => (
            <FadeIn key={index} delay={0.1 * index}>
              <HoverCard>
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${metric.color}-100 dark:bg-${metric.color}-900/20`}>
                      <metric.icon className={`size-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <div className="text-sm text-muted">{metric.title}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted">{metric.description}</p>
                </div>
              </HoverCard>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.8}>
          <div className="card-modern p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: "Security scan completed", time: "2 minutes ago", status: "success" },
                { action: "Cost optimization applied", time: "15 minutes ago", status: "success" },
                { action: "New EC2 instance detected", time: "1 hour ago", status: "info" },
                { action: "Performance alert resolved", time: "3 hours ago", status: "warning" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted">{activity.time}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}