"use client";

import { cn } from "@/lib/utils";
import {
    Palette,
    CircleDollarSign,
    Check,
    ChevronRight,
    CheckCircle,
} from "lucide-react";
import { useState } from "react";

const SAMPLE_FORM_DATA = {
    product: {
        colors: [
            { name: "Midnight", hex: "#0F172A" },
            { name: "Ocean", hex: "#0EA5E9" },
            { name: "Forest", hex: "#059669" },
            { name: "Sunset", hex: "#DC2626" },
        ],
        materials: ["Premium Wood", "Aluminum", "Composite", "Bamboo"],
        sizes: ["Small", "Medium", "Large", "Custom"],
    },
};

interface FormProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: typeof SAMPLE_FORM_DATA;
}

interface FormSelections {
    colorIndex: number;
    materialIndex: number;
    sizeIndex: number;
}

export default function Form04({
    data = SAMPLE_FORM_DATA,
    className,
    ...props
}: FormProps) {
    const [selections, setSelections] = useState<FormSelections>({
        colorIndex: 0,
        materialIndex: 0,
        sizeIndex: 1,
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    function handleSubmit() {
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
        }, 2000);
    }

    return (
        <div
            className={cn(
                "group relative overflow-hidden",
                "w-full max-w-md",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800",
                "rounded-2xl transition-all duration-300 hover:shadow-md",
                className
            )}
            {...props}
        >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-3 text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                        {isSubmitted ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <Palette className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {isSubmitted ? "Order Placed!" : "Customize Product"}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {isSubmitted
                            ? "Your order is being processed"
                            : "Step 1 of 3 - Choose specifications"}
                    </p>
                </div>
            </div>

            {!isSubmitted && (
                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Color
                        </label>
                        <div className="flex items-center gap-3">
                            {data.product.colors.map((color, index) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={() =>
                                        setSelections((prev) => ({
                                            ...prev,
                                            colorIndex: index,
                                        }))
                                    }
                                    className={cn(
                                        "group relative w-12 h-12 rounded-2xl",
                                        "ring-2 ring-transparent hover:ring-violet-600 dark:hover:ring-violet-400",
                                        "transition-all duration-200",
                                        index === selections.colorIndex &&
                                            "ring-violet-600 dark:ring-violet-400"
                                    )}
                                    style={{ backgroundColor: color.hex }}
                                >
                                    {index === selections.colorIndex && (
                                        <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
                                    )}
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        {color.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Material
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {data.product.materials.map((material, index) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={() =>
                                        setSelections((prev) => ({
                                            ...prev,
                                            materialIndex: index,
                                        }))
                                    }
                                    className={cn(
                                        "h-12 px-4 rounded-lg flex items-center justify-between",
                                        "bg-zinc-50 dark:bg-zinc-800/50",
                                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                        "border-2 border-transparent",
                                        index === selections.materialIndex &&
                                            "border-violet-600 dark:border-violet-400",
                                        "transition-colors"
                                    )}
                                >
                                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                        {material}
                                    </span>
                                    {index === selections.materialIndex && (
                                        <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Size
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {data.product.sizes.map((size, index) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={() =>
                                        setSelections((prev) => ({
                                            ...prev,
                                            sizeIndex: index,
                                        }))
                                    }
                                    className={cn(
                                        "h-12 rounded-lg flex items-center justify-center",
                                        "bg-zinc-50 dark:bg-zinc-800/50",
                                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                        "border-2 border-transparent",
                                        index === selections.sizeIndex &&
                                            "border-violet-600 dark:border-violet-400",
                                        "transition-colors"
                                    )}
                                >
                                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                        {size}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-800">
                                <CircleDollarSign className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Total Price
                                </p>
                                <p className="text-xs text-zinc-500">
                                    Including delivery
                                </p>
                            </div>
                        </div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            $299.00
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full h-12 rounded-lg flex items-center justify-center gap-2
                        bg-violet-600 hover:bg-violet-700
                        text-white font-medium
                        transition-colors"
                    >
                        Continue to Shipping
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
