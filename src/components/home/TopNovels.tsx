import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Novel } from '@/types/novel';
import { NovelCard } from '@/components/novel/NovelCard';

interface TopNovelsProps {
  novels: Novel[];
  title?: string;
}

export function TopNovels({ novels, title = "Top 10 da Semana" }: TopNovelsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-gold" />
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {novels.slice(0, 10).map((novel, index) => (
          <div key={novel.id} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {index + 1}
            </span>
            <div className="flex-1">
              <NovelCard novel={novel} index={index} variant="compact" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
