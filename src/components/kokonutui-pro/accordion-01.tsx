"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface ServiceCategory {
    label: string;
    id: string;
}

interface Service {
    id: string;
    title: string;
    description: string;
    categories: ServiceCategory[];
}

const services: Service[] = [
    {
        id: "001",
        title: "AI Model Development",
        description:
            "Custom large language models and neural networks tailored to your specific needs. From fine-tuning foundation models to building specialized AI solutions that transform your business.",
        categories: [
            { label: "LLM Development", id: "llm-dev" },
            { label: "Fine-tuning", id: "fine-tuning" },
            { label: "Neural Networks", id: "neural-networks" },
            { label: "Model Optimization", id: "model-optimization" },
            { label: "MLOps", id: "mlops" },
            { label: "Custom Training", id: "custom-training" },
        ],
    },
    {
        id: "002",
        title: "Generative AI Solutions",
        description:
            "Cutting-edge generative AI applications for text, image, and code generation. Leverage the power of AI to automate content creation and enhance creative workflows.",
        categories: [
            { label: "Text Generation", id: "text-gen" },
            { label: "Image Synthesis", id: "image-gen" },
            { label: "Code Generation", id: "code-gen" },
            { label: "Creative AI", id: "creative-ai" },
        ],
    },
    {
        id: "003",
        title: "AI Integration & APIs",
        description:
            "Seamless integration of AI capabilities into your existing systems. RESTful APIs, microservices, and scalable infrastructure for AI-powered features.",
        categories: [
            { label: "API Development", id: "api-dev" },
            { label: "Cloud Integration", id: "cloud" },
            { label: "Real-time Processing", id: "real-time" },
        ],
    },
    {
        id: "004",
        title: "AI Analytics & Insights",
        description:
            "Advanced analytics and business intelligence powered by AI. Transform raw data into actionable insights with predictive modeling and machine learning.",
        categories: [
            { label: "Predictive Analytics", id: "predictive" },
            { label: "Data Mining", id: "data-mining" },
            { label: "Business Intelligence", id: "bi" },
        ],
    },
];

export default function Accordion01() {
    const [expandedService, setExpandedService] = useState<string>("001");

    return (
        <section className="py-24 sm:py-32 bg-white dark:bg-black text-neutral-900 dark:text-white w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="space-y-4">
                    {services.map((service) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="group border-t border-neutral-200 dark:border-neutral-800 relative"
                        >
                            {/* Background hover effect */}
                            {/* <div className="absolute inset-0 bg-neutral-50 dark:bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}

                            {/* Collapsed State - Clickable Row */}
                            <button
                                type="button"
                                onClick={() =>
                                    setExpandedService(
                                        expandedService === service.id
                                            ? ""
                                            : service.id
                                    )

                                }
                                className="w-full py-6 flex items-center justify-between relative"
                                aria-label={
                                    expandedService === service.id
                                        ? "Show less"
                                        : "Show more"
                                }
                            >
                                <div className="flex items-center gap-6">
                                    <span className="text-sm text-neutral-400 dark:text-neutral-500 font-mono group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors duration-200">
                                        ({service.id})
                                    </span>
                                    <AnimatePresence mode="wait">
                                        {expandedService !== service.id && (
                                            <motion.h3
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="text-xl font-medium group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors duration-200"
                                            >
                                                {service.title}
                                            </motion.h3>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8">
                                    {expandedService === service.id ? (
                                        <Minus className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors duration-200" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors duration-200" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded State */}
                            <AnimatePresence>
                                {expandedService === service.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden relative"
                                    >
                                        <div className="pb-8 space-y-8">
                                            {/* Image Row */}
                                            <div className="flex flex-wrap gap-4">
                                                {[1, 2, 3].map((index) => (
                                                    <div
                                                        key={index}
                                                        className="w-full sm:w-[120px] aspect-video sm:h-[80px] rounded-lg bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden group/image hover:scale-[1.02] transition-transform duration-300"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 group-hover/image:opacity-80 transition-opacity duration-300" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-col lg:flex-row lg:justify-between gap-8">
                                                <div className="space-y-4 max-w-xl">
                                                    <motion.h4
                                                        initial={{
                                                            opacity: 0,
                                                            y: 10,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        className="text-xl font-medium"
                                                    >
                                                        {service.title}
                                                    </motion.h4>
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{
                                                            delay: 0.1,
                                                        }}
                                                        className="text-neutral-600 dark:text-neutral-400"
                                                    >
                                                        {service.description}
                                                    </motion.p>
                                                </div>

                                                {/* Categories */}
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        x: 20,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    transition={{ delay: 0.2 }}
                                                    className="flex flex-wrap gap-2 content-start"
                                                >
                                                    {service.categories.map(
                                                        (category) => (
                                                            <span
                                                                key={
                                                                    category.id
                                                                }
                                                                className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-white/5 text-sm hover:bg-neutral-200 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
                                                            >
                                                                {category.label}
                                                            </span>
                                                        )
                                                    )}
                                                </motion.div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
