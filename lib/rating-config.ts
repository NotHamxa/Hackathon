export const ratingLabels: Record<number, string> = {
  1: "Completely False",
  2: "Probably False",
  3: "Uncertain",
  4: "Probably True",
  5: "Completely True",
};

export const ratingColors: Record<number, string> = {
  1: "hover:bg-red-500/10 hover:text-red-700 data-[selected]:bg-red-500/15 data-[selected]:text-red-700 dark:hover:text-red-400 dark:data-[selected]:text-red-400",
  2: "hover:bg-orange-500/10 hover:text-orange-700 data-[selected]:bg-orange-500/15 data-[selected]:text-orange-700 dark:hover:text-orange-400 dark:data-[selected]:text-orange-400",
  3: "hover:bg-yellow-500/10 hover:text-yellow-700 data-[selected]:bg-yellow-500/15 data-[selected]:text-yellow-700 dark:hover:text-yellow-400 dark:data-[selected]:text-yellow-400",
  4: "hover:bg-lime-500/10 hover:text-lime-700 data-[selected]:bg-lime-500/15 data-[selected]:text-lime-700 dark:hover:text-lime-400 dark:data-[selected]:text-lime-400",
  5: "hover:bg-green-500/10 hover:text-green-700 data-[selected]:bg-green-500/15 data-[selected]:text-green-700 dark:hover:text-green-400 dark:data-[selected]:text-green-400",
};

export const ratingBadgeColors: Record<number, string> = {
  1: "bg-red-500/15 text-red-700 dark:text-red-400",
  2: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  3: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  4: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
  5: "bg-green-500/15 text-green-700 dark:text-green-400",
};
