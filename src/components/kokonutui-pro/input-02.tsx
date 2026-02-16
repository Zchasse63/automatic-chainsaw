"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Input02Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input02 = React.forwardRef<HTMLInputElement, Input02Props>(
    ({ error, icon, className, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const [hasValue, setHasValue] = React.useState(false);

        React.useEffect(() => {
            setHasValue(Boolean(props.value || props.defaultValue));
        }, [props.value, props.defaultValue]);

        return (
            <div className="relative">
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10">
                            {icon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => {
                            setIsFocused(false);
                            setHasValue(e.target.value !== "");
                        }}
                        className={cn(
                            // Base styles
                            "w-full h-11 px-4",
                            icon && "pl-10",
                            "bg-zinc-100 dark:bg-zinc-800",
                            "border border-zinc-200 dark:border-transparent",
                            "text-sm text-zinc-900 dark:text-zinc-100",
                            "placeholder:text-zinc-500",
                            "rounded-xl",
                            
                            // Focus and hover styles
                            "focus:outline-hidden",
                            "hover:border-zinc-300 dark:hover:border-zinc-700",
                            
                            // Transitions
                            "transition-colors",
                            "duration-200",
                            
                            // Error styles
                            error && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                            
                            // Disabled styles
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            
                            className
                        )}
                        {...props}
                    />
                </div>

                {error && (
                    <p className="mt-1.5 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);
Input02.displayName = "Input02";

export default Input02;
