'use client'

import { motion } from 'framer-motion'

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
}

export default function SplitText({ text, className = '', delay = 0 }: SplitTextProps) {
  const words = text.split(' ')

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}