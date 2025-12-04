import { motion } from 'framer-motion';
import { Youtube, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function YouTubeWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-4">
        <Youtube className="w-5 h-5 text-red-500" />
        <h3 className="font-display font-semibold text-foreground">Novels Narradas</h3>
      </div>
      
      {/* Embedded Video */}
      <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/videoseries?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
          title="Novels Narradas"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Ouça suas novels favoritas narradas profissionalmente no nosso canal do YouTube.
      </p>

      <div className="space-y-2">
        <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700" asChild>
          <a href="https://youtube.com/@novelbrasil" target="_blank" rel="noopener noreferrer">
            <Youtube className="w-4 h-4 mr-2" />
            Inscreva-se
          </a>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <a href="/narradas">
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Todas
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
