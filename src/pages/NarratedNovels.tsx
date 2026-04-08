import { motion } from 'framer-motion';
import { Youtube, ExternalLink, Play } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { NovelCard } from '@/components/novel/NovelCard';
import { Button } from '@/components/ui/button';
import { useNovels } from '@/hooks/useNovels';

const NarratedNovels = () => {
  const { novels: novelsWithVideo, loading } = useNovels({ onlyWithVideo: true });

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading narrated novels...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative py-20 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <Youtube className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">Narrated Novels</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Listen to your favorite stories professionally narrated. Perfect for when you want to relax or are on the go.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="destructive" size="lg" className="bg-red-600 hover:bg-red-700" asChild>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-5 h-5 mr-2" />Subscribe to Channel
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5 mr-2" />View Playlists
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
          <div className="aspect-video rounded-xl overflow-hidden card-shadow border border-border">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/videoseries?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf" title="Narrated Novels Playlist" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Play className="w-6 h-6 text-red-500" />
          <h2 className="font-display text-2xl font-bold text-foreground">Available as Audio</h2>
        </div>
        {novelsWithVideo.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No narrated novels available at the moment.</p>
            <p className="text-sm text-muted-foreground">We're always adding new narrations. Subscribe to the channel to be notified!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {novelsWithVideo.map((novel, index) => (
              <div key={novel.id} className="relative">
                <NovelCard novel={novel} index={index} />
                <div className="absolute top-3 right-12 bg-red-600 rounded-full p-1.5">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border-t border-b border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="text-4xl font-display font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Narrated Novels</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-4xl font-display font-bold text-primary mb-2">100K+</div>
              <p className="text-muted-foreground">Total Views</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-4xl font-display font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Subscribers</p>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NarratedNovels;
