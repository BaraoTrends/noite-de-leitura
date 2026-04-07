import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/types/novel';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';

export function CategoryFilter() {
  const { selectedCategories, toggleCategory, clearCategories } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Categories</h3>
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCategories}
            className="text-xs text-muted-foreground hover:text-foreground h-auto py-1"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {CATEGORIES.map((category) => (
          <label
            key={category}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <Checkbox
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => toggleCategory(category)}
              className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {category}
            </span>
          </label>
        ))}
      </div>
    </motion.div>
  );
}
