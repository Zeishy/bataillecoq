import { motion } from 'framer-motion';

// Card Skeleton
export const CardSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
    className="bg-gray-800 rounded-lg p-6 space-y-4"
  >
    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
  </motion.div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
        className="bg-gray-800 rounded-lg p-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Tournament Card Skeleton
export const TournamentCardSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
    className="bg-gray-800 rounded-xl overflow-hidden"
  >
    <div className="h-48 bg-gray-700"></div>
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      <div className="flex gap-2 mt-4">
        <div className="h-10 bg-gray-700 rounded flex-1"></div>
        <div className="h-10 bg-gray-700 rounded flex-1"></div>
      </div>
    </div>
  </motion.div>
);

// List Skeleton
export const ListSkeleton = ({ items = 3 }) => (
  <div className="space-y-2">
    {[...Array(items)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
        className="flex items-center gap-3 bg-gray-800 rounded-lg p-3"
      >
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Stats Skeleton
export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
          <div className="h-8 w-16 bg-gray-700 rounded"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </motion.div>
    ))}
  </div>
);

// Chat Skeleton
export const ChatSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
        className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
      >
        <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0"></div>
        <div className={`flex-1 max-w-xs space-y-2 ${i % 2 === 0 ? '' : 'items-end'}`}>
          <div className={`h-3 bg-gray-700 rounded ${i % 2 === 0 ? 'w-20' : 'w-24 ml-auto'}`}></div>
          <div className={`h-12 bg-gray-700 rounded ${i % 2 === 0 ? 'w-full' : 'w-3/4 ml-auto'}`}></div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default {
  CardSkeleton,
  TableSkeleton,
  TournamentCardSkeleton,
  ListSkeleton,
  StatsSkeleton,
  ChatSkeleton
};
