'use client'
import { HeroHeader } from '@/components/hero5-header'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, Shield, DollarSign } from 'lucide-react'
import { SuperJson, Ec2Analysis, CfnAnalysis, S3Analysis, Recommendation } from './types'

interface AnalysisDetailClientProps {
    initialData: SuperJson
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

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
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
}

export default function AnalysisDetailPage({ initialData }: AnalysisDetailClientProps) {
    const renderEC2Analysis = (data: Ec2Analysis) => {
        const securityScore = data.overall_security_score || 0
        const performanceScore = data.overall_performance_score || 0
        
        const recommendationsData = [
            { name: 'Critical', value: data.critical_count || 0 },
            { name: 'High', value: data.high_count || 0 },
            { name: 'Medium', value: data.medium_count || 0 },
            { name: 'Low', value: data.low_count || 0 },
        ]

        const topRecommendation = data.recommendations?.[0]

        return (
            <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2 
                    className="text-2xl font-semibold mb-4 flex items-center gap-2"
                    variants={itemVariants}
                >
                    <Shield className="w-6 h-6" />
                    EC2 Analysis
                </motion.h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                        className="bg-white rounded-lg p-6 shadow-sm"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-medium mb-4">Security Score</h3>
                        <div className="w-32 h-32 mx-auto">
                            <CircularProgressbar
                                value={securityScore}
                                maxValue={100}
                                text={`${securityScore}%`}
                                styles={buildStyles({
                                    pathColor: securityScore >= 70 ? '#00C49F' : securityScore >= 40 ? '#FFBB28' : '#FF8042',
                                })}
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">Security Vulnerabilities: {data.security_vulnerabilities_count || 0}</p>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="bg-white rounded-lg p-6 shadow-sm"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-medium mb-4">Performance Score</h3>
                        <div className="w-32 h-32 mx-auto">
                            <CircularProgressbar
                                value={performanceScore}
                                maxValue={100}
                                text={`${performanceScore}%`}
                                styles={buildStyles({
                                    pathColor: performanceScore >= 70 ? '#00C49F' : performanceScore >= 40 ? '#FFBB28' : '#FF8042',
                                })}
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">Performance Issues: {data.performance_issues_count || 0}</p>
                        </div>
                    </motion.div>
                </div>

                <motion.div 
                    className="bg-white rounded-lg p-6 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-lg font-medium mb-4">Summary</h3>
                    <p className="text-gray-600">{data.summary}</p>
                </motion.div>

                {topRecommendation && (
                    <motion.div 
                        className="bg-white rounded-lg p-6 shadow-sm"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Top Priority Action
                        </h3>
                        <div className="space-y-2">
                            <p className="font-medium">{topRecommendation.description}</p>
                            <p className="text-sm text-gray-600">Impact: {topRecommendation.impact}</p>
                            <div className="mt-4">
                                <h4 className="font-medium mb-2">Quick Fix:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {topRecommendation.remediation_steps?.map((step: string, index: number) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div 
                    className="bg-white rounded-lg p-6 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-lg font-medium mb-4">All Recommendations</h3>
                    <div className="space-y-4">
                        {data.recommendations && data.recommendations.length > 0 ? (
                            data.recommendations.map((rec, index) => (
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                            rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                            rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {rec.priority}
                                        </span>
                                        <span className="text-sm font-medium">{rec.category}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                                    <div className="text-sm">
                                        <p className="font-medium">Impact:</p>
                                        <p className="text-gray-600">{rec.impact}</p>
                                    </div>
                                    {rec.remediation_steps && (
                                        <div className="mt-2">
                                            <p className="font-medium text-sm">Remediation Steps:</p>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                {rec.remediation_steps.map((step: string, idx: number) => (
                                                    <li key={idx}>{step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600 text-center py-4">No recommendations available for this EC2 instance.</p>
                        )}
                    </div>
                </motion.div>

                <motion.div 
                    className="bg-white rounded-lg p-6 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-lg font-medium mb-4">Recommendations by Priority</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={recommendationsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {recommendationsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div 
                    className="bg-white rounded-lg p-6 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Cost Analysis
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Current Monthly Cost</p>
                            <p className="text-2xl font-bold">${data.total_current_monthly_cost?.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Estimated Monthly Savings</p>
                            <p className="text-2xl font-bold text-green-600">${data.total_estimated_monthly_savings?.toFixed(2)}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )
    }

    const renderCloudFormationAnalysis = (data: CfnAnalysis) => {
        const recommendationsByCategory = data.recommendations.reduce((acc: Record<string, number>, rec) => {
            acc[rec.category] = (acc[rec.category] || 0) + 1
            return acc
        }, {})

        const chartData = Object.entries(recommendationsByCategory).map(([category, count]) => ({
            name: category,
            value: count,
        }))

        const topRecommendation = data.recommendations?.[0]

        return (
            <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2 
                    className="text-2xl font-semibold mb-4 flex items-center gap-2"
                    variants={itemVariants}
                >
                    <TrendingUp className="w-6 h-6" />
                    CloudFormation Analysis
                </motion.h2>
                
                {topRecommendation && (
                    <motion.div 
                        className="bg-white rounded-lg p-6 shadow-sm"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Top Priority Action
                        </h3>
                        <div className="space-y-2">
                            <p className="font-medium">{topRecommendation.description}</p>
                            <p className="text-sm text-gray-600">Impact: {topRecommendation.impact}</p>
                            <div className="mt-4">
                                <h4 className="font-medium mb-2">Quick Fix:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {topRecommendation.remediation_steps?.slice(0, 2).map((step: string, index: number) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div 
                    className="bg-white rounded-lg p-6 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-lg font-medium mb-4">Recommendations by Category</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div 
                    className="bg-white rounded-lg p-6 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Cost Analysis
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Current Monthly Cost</p>
                            <p className="text-2xl font-bold">${data.total_current_cost?.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Estimated Monthly Savings</p>
                            <p className="text-2xl font-bold text-green-600">${data.total_estimated_savings?.toFixed(2)}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )
    }

    const renderS3Analysis = (data: S3Analysis[]) => {
        return (
            <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2 
                    className="text-2xl font-semibold mb-4 flex items-center gap-2"
                    variants={itemVariants}
                >
                    <Shield className="w-6 h-6" />
                    S3 Analysis
                </motion.h2>

                {data.map((bucket, bucketIndex) => (
                    <motion.div 
                        key={bucketIndex}
                        className="bg-white rounded-lg p-6 shadow-sm"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-medium mb-4">{bucket.bucket_name}</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Objects</p>
                                <p className="text-2xl font-bold">{bucket.total_objects?.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Size</p>
                                <p className="text-2xl font-bold">{(bucket.total_size / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-medium mb-2">Summary</h4>
                            <p className="text-sm text-gray-600">{bucket.summary}</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium">Recommendations</h4>
                            {bucket.recommendations?.map((rec, index) => (
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                            rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                            rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {rec.priority}
                                        </span>
                                        <span className="text-sm font-medium">{rec.category}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                                    <div className="text-sm">
                                        <p className="font-medium">Impact:</p>
                                        <p className="text-gray-600">{rec.impact}</p>
                                    </div>
                                    {rec.affected_prefixes && rec.affected_prefixes.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-medium text-sm">Affected Prefixes:</p>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                {rec.affected_prefixes.map((prefix: string, idx: number) => (
                                                    <li key={idx}>{prefix}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {rec.remediation_steps && (
                                        <div className="mt-2">
                                            <p className="font-medium text-sm">Remediation Steps:</p>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                {rec.remediation_steps.map((step: string, idx: number) => (
                                                    <li key={idx}>{step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {rec.compliance_impact && rec.compliance_impact.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-medium text-sm">Compliance Impact:</p>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                {rec.compliance_impact.map((impact: string, idx: number) => (
                                                    <li key={idx}>{impact}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Current Monthly Cost</p>
                                <p className="text-2xl font-bold">${bucket.total_current_cost?.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Estimated Monthly Savings</p>
                                <p className="text-2xl font-bold text-green-600">${bucket.total_estimated_savings?.toFixed(2)}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            <HeroHeader />
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="mx-auto max-w-4xl">
                    <motion.h1 
                        className="mb-8 text-4xl font-bold"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                    >
                        Analysis Results
                    </motion.h1>
                    <div className="space-y-12">
                        {initialData.awsec2hawk?.[0] && renderEC2Analysis(initialData.awsec2hawk[0])}
                        {initialData.awscfnhawk?.[0] && renderCloudFormationAnalysis(initialData.awscfnhawk[0])}
                        {initialData.awss3hawk?.[0] && renderS3Analysis(initialData.awss3hawk)}
                    </div>
                </div>
            </div>
        </main>
    )
} 