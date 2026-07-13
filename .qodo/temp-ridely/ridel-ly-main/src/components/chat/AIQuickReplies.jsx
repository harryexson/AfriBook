import React from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, MapPin, Clock, Star, Pizza, Coffee, Salad, Sandwich } from 'lucide-react';
import { motion } from 'framer-motion';

const quickReplies = [
  { text: "Find restaurants nearby", icon: MapPin },
  { text: "What's popular today?", icon: Star },
  { text: "I want pizza", icon: Pizza },
  { text: "Something quick", icon: Clock },
  { text: "Healthy options", icon: Salad },
  { text: "Coffee & breakfast", icon: Coffee },
  { text: "Lunch specials", icon: Sandwich },
  { text: "Show all cuisines", icon: Utensils },
];

export default function AIQuickReplies({ onSelect, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {quickReplies.map((reply, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(reply.text)}
            disabled={disabled}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs gap-1.5"
          >
            <reply.icon className="w-3 h-3" />
            {reply.text}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}