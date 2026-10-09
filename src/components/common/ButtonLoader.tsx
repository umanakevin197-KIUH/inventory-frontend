import { motion } from "framer-motion";

export function ButtonLoader() {
    return (
        <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-current"
                />
            ))}
        </div>
    );
}