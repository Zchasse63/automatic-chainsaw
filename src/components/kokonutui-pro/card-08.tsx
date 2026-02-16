import { cn } from "@/lib/utils";
import { CheckCircle, Clock, TrendingUp, Video, Globe } from "lucide-react";

const SAMPLE_CARD_DATA = {
    title: "Analytics Dashboard",
    meta: "v2.4.1",
    description: "Real-time metrics with AI-powered insights and predictive analytics",
    icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
    status: "Live",
    tags: ["Statistics", "Reports", "AI"],
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: typeof SAMPLE_CARD_DATA;
}

export default function Card08({
    data = SAMPLE_CARD_DATA,
    className,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
                "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                "hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
                "hover:-translate-y-0.5 will-change-transform",
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 -z-10 rounded-xl p-px bg-linear-to-br from-transparent via-zinc-200/50 to-transparent dark:via-zinc-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex flex-col space-y-3">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 transition-colors duration-300">
                        {data.icon}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
                        {data.status}
                    </span>
                </div>

                {/* Content Section */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {data.title}
                        <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400 font-normal">
                            {data.meta}
                        </span>
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-snug">
                        {data.description}
                    </p>
                </div>

                {/* Tags Section */}
                <div className="flex flex-wrap gap-2">
                    {data.tags?.map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
} 