"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Input03Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input03 = React.forwardRef<HTMLInputElement, Input03Props>(
    ({ label, error, icon, className, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const [hasValue, setHasValue] = React.useState(false);

        React.useEffect(() => {
            setHasValue(Boolean(props.value || props.defaultValue));
        }, [props.value, props.defaultValue]);

        return (
            <div
                className={cn(
                    "relative p-4 bg-white dark:bg-zinc-900",
                    "border border-zinc-200 dark:border-zinc-800",
                    "rounded-xl shadow-xs transition-all duration-300",
                    "hover:shadow-md",
                    className
                )}
            >
                {label && (
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {label}
                        </label>
                        {icon && (
                            <div className="text-zinc-400 dark:text-zinc-500">
                                {icon}
                            </div>
                        )}
                    </div>
                )}

                <input
                    ref={ref}
                    onFocus={() => setIsFocused(true)}
                    onBlur={(e) => {
                        setIsFocused(false);
                        setHasValue(e.target.value !== "");
                    }}
                    {...props}
                    className={cn(
                        "w-full h-10 px-3",
                        "bg-zinc-100 dark:bg-zinc-800",
                        "text-zinc-900 dark:text-zinc-100",
                        "border border-transparent rounded-lg",
                        "focus:outline-hidden focus:border-zinc-300 dark:focus:border-zinc-700",
                        "transition-colors duration-200",
                        error && "border-red-500 focus:border-red-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    placeholder={label ? " " : props.placeholder}
                />

                {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input03.displayName = "Input03";

export default Input03;
