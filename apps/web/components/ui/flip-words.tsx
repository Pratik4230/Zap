"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!ready || isAnimating) return;
    const id = window.setTimeout(startAnimation, duration);
    return () => window.clearTimeout(id);
  }, [ready, isAnimating, duration, startAnimation]);

  const wordClassName = cn(
    "relative z-10 inline-block px-2 text-left whitespace-nowrap text-neutral-100",
    className
  );

  const word = (
    ready ? (
      <AnimatePresence
        onExitComplete={() => {
          setIsAnimating(false);
        }}
      >
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          exit={{
            opacity: 0,
            y: -40,
            x: 40,
            filter: "blur(8px)",
            scale: 2,
            position: "absolute",
          }}
          className={cn(wordClassName, "col-start-1 row-start-1")}
        >
          {currentWord.split(" ").map((part, wordIndex) => (
            <motion.span
              key={part + wordIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: wordIndex * 0.3,
                duration: 0.3,
              }}
              className="inline-block whitespace-nowrap"
            >
              {part.split("").map((letter, letterIndex) => (
                <motion.span
                  key={part + letterIndex}
                  initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: wordIndex * 0.3 + letterIndex * 0.05,
                    duration: 0.2,
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    ) : (
      <span className={cn(wordClassName, "col-start-1 row-start-1")}>
        {words[0]}
      </span>
    )
  );

  return (
    <span className="relative inline-grid justify-items-start">
      {words.map((item) => (
        <span
          key={item}
          className={cn(wordClassName, "invisible col-start-1 row-start-1")}
          aria-hidden
        >
          {item}
        </span>
      ))}
      {word}
    </span>
  );
};
