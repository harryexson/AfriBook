import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AITypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
        <Bot className="h-5 w-5 text-primary" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-2xl px-4 py-3"
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-slate-400 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}