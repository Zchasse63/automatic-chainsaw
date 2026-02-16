import { cn } from "@/lib/utils";
import {
    User,
    Camera,
    AtSign,
    Link,
    MapPin,
    Globe,
    Check,
    X,
    Building,
} from "lucide-react";

// Dummy data
const SAMPLE_FORM_DATA = {
    profile: {
        avatar: "https://bykuknqwpctcjrowysyf.supabase.co/storage/v1/object/public/assets/avatar-01.png",
        name: "Alex Morgan",
        email: "alex@company.com",
        location: "San Francisco, CA",
        website: "alexmorgan.dev",
        bio: "Full-stack developer passionate about building great products.",
        company: "TechCorp",
        verified: true,
    },
};

interface FormProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: typeof SAMPLE_FORM_DATA;
}

export default function Form06({
    data = SAMPLE_FORM_DATA,
    className,
    ...props
}: FormProps) {
    return (
        <div
            className={cn(
                "w-full max-w-md mx-auto",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800",
                "rounded-2xl overflow-hidden",
                "shadow-xl shadow-black/5",
                className
            )}
            {...props}
        >
            {/* Header with Avatar */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-black overflow-hidden flex items-center justify-center">
                            <img
                                src="https://bykuknqwpctcjrowysyf.supabase.co/storage/v1/object/public/assets/avatar-01.png"
                                alt="Profile"
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                            Edit Profile
                        </h3>
                        <p className="text-sm text-zinc-500">
                            Update your personal information
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="px-6 pb-6 space-y-4">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            defaultValue={data.profile.name}
                            className="w-full h-10 pl-10 pr-4 rounded-lg
                                bg-zinc-50 dark:bg-zinc-800/50
                                text-zinc-900 dark:text-zinc-100
                                border border-zinc-200 dark:border-zinc-800
                                focus:outline-hidden focus:ring-2 focus:ring-blue-500/20
                                transition-all"
                        />
                    </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Email
                    </label>
                    <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="email"
                            defaultValue={data.profile.email}
                            className="w-full h-10 pl-10 pr-4 rounded-lg
                                bg-zinc-50 dark:bg-zinc-800/50
                                text-zinc-900 dark:text-zinc-100
                                border border-zinc-200 dark:border-zinc-800
                                focus:outline-hidden focus:ring-2 focus:ring-blue-500/20
                                transition-all"
                        />
                    </div>
                </div>

                {/* Location & Website */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                defaultValue={data.profile.location}
                                className="w-full h-10 pl-10 pr-4 rounded-lg
                                    bg-zinc-50 dark:bg-zinc-800/50
                                    text-zinc-900 dark:text-zinc-100
                                    border border-zinc-200 dark:border-zinc-800
                                    focus:outline-hidden focus:ring-2 focus:ring-blue-500/20
                                    transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Website
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="url"
                                defaultValue={data.profile.website}
                                className="w-full h-10 pl-10 pr-4 rounded-lg
                                    bg-zinc-50 dark:bg-zinc-800/50
                                    text-zinc-900 dark:text-zinc-100
                                    border border-zinc-200 dark:border-zinc-800
                                    focus:outline-hidden focus:ring-2 focus:ring-blue-500/20
                                    transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Bio
                    </label>
                    <textarea
                        defaultValue={data.profile.bio}
                        rows={3}
                        className="w-full p-3 rounded-lg resize-none
                            bg-zinc-50 dark:bg-zinc-800/50
                            text-zinc-900 dark:text-zinc-100
                            border border-zinc-200 dark:border-zinc-800
                            focus:outline-hidden focus:ring-2 focus:ring-blue-500/20
                            transition-all"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        className="flex-1 h-10 rounded-lg
                        bg-zinc-100 dark:bg-zinc-800
                        text-zinc-600 dark:text-zinc-400
                        hover:bg-zinc-200 dark:hover:bg-zinc-700
                        transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        className="flex-1 h-10 rounded-lg
                        bg-blue-600 hover:bg-blue-700
                        text-white
                        transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
