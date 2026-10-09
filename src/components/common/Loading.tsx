import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export function Loading({ message = "Cargando...", fullScreen = true }: LoadingProps) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
            >
                <Zap className="text-white" size={32} />
            </motion.div>

            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [-4, 4, -4],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                            }}
                            className="w-2 h-2 rounded-full bg-blue-400"
                        />
                    ))}
                </div>
                <span className="text-white/50 text-sm">{message}</span>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
                {content}
            </div>
        );
    }

    return <div className="py-12 flex justify-center">{content}</div>;
}