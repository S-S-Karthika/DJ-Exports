import { motion } from "motion/react";

const paths = [
  // stem and side branch
  "M100 255 C 98 220, 104 190, 100 146",
  "M100 212 C 118 202, 134 190, 150 172",
  // cotton boll outline
  "M100 62 C 118 50, 140 64, 134 84 C 154 88, 158 114, 140 122 C 148 142, 126 156, 110 144 C 100 156, 82 154, 78 140 C 58 146, 46 124, 60 112 C 44 98, 56 76, 76 80 C 74 62, 90 52, 100 62 Z",
  // seams inside the boll
  "M100 62 C 103 80, 102 98, 100 112",
  "M134 84 C 120 92, 108 102, 100 112",
  "M60 112 C 74 110, 88 111, 100 112",
  "M110 144 C 106 132, 103 122, 100 112",
  "M78 140 C 86 130, 94 120, 100 112",
  // sepals under the boll
  "M100 146 C 92 152, 82 160, 70 162 C 80 154, 90 149, 100 146",
  "M100 146 C 110 153, 122 158, 134 157 C 122 151, 111 148, 100 146",
  // right leaf + vein
  "M150 172 C 164 152, 184 150, 194 158 C 184 174, 166 180, 150 172 Z",
  "M150 172 C 164 166, 180 161, 194 158",
  // left leaf + vein
  "M100 226 C 84 214, 64 216, 54 230 C 68 240, 88 238, 100 226 Z",
  "M100 226 C 86 228, 70 229, 54 230",
];

export default function CottonBranch({ className = "" }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      style={{ transformOrigin: "50% 100%" }}
      animate={{ rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.svg
        viewBox="0 0 200 260"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        {paths.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              show: {
                pathLength: 1,
                opacity: 1,
                transition: {
                  pathLength: { duration: 1.6, delay: i * 0.12, ease: "easeInOut" },
                  opacity: { duration: 0.2, delay: i * 0.12 },
                },
              },
            }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}