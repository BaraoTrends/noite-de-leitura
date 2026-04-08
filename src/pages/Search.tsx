import { useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { NovelCard } from '@/components/novel/NovelCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useNovels } from '@/hooks/useNovels';
import { CATEGORIES, AGE_RATINGS } from '@/types/novel';

const RESULTS_PER_PAGE = 9;

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAgeRatings, setSelectedAgeRatings] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { novels: allNovels, loading } = useNovels();

  const results = useMemo(() => {
    let filtered = query
      ? allNovels.filter(n =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.author.name.toLowerCase().includes(query.toLowerCase()) ||
          n.synopsis.toLowerCase().includes(query.toLowerCase())
        )
      : allNovels;
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((n) => n.categories.some((c) => selectedCategories.includes(c)));
    }
    if (selectedAgeRatings.length > 0) {
      filtered = filtered.filter((n) => selectedAgeRatings.includes(n.ageRating));
    }
    return filtered;
  }, [allNovels, query, selectedCategories, selectedAgeRatings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategories, selectedAgeRatings]);

  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return results.slice(start, start + RESULTS_PER_PAGE);
  }, [currentPage, results]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setCurrentPage(1); setSearchParams(query ? { q: query } : {}); };
  const toggleCategory = (category: string) => { setSelectedCategories((prev) => prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]); };
  const toggleAgeRating = (rating: string) => { setSelectedAgeRatings((prev) => prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]); };
  const clearFilters = () => { setSelectedCategories([]); setSelectedAgeRatings([]); };
  const hasFilters = selectedCategories.length > 0 || selectedAgeRatings.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground text-center mb-8">Search Novels</h1>
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="text" placeholder="Search by title, author, tags..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12 pr-4 py-6 text-lg bg-card border-border" />
            <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">Search</Button>
          </form>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Filters</h3>
                  {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">Clear</Button>}
                </div>
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Categories</h4>
                  <div className="space-y-2">
                    {CATEGORIES.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={selectedCategories.includes(category)} onCheckedChange={() => toggleCategory(category)} />
                        <span className="text-sm text-foreground">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Age Rating</h4>
                  <div className="space-y-2">
                    {AGE_RATINGS.map((rating) => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={selectedAgeRatings.includes(rating)} onCheckedChange={() => toggleAgeRating(rating)} />
                        <span className="text-sm text-foreground">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:hidden mb-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Filters {hasFilters && `(${selectedCategories.length + selectedAgeRatings.length})`}
            </Button>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Filters</h3>
                  {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Categories</h4>
                    <div className="space-y-2">
                      {CATEGORIES.map((category) => (
                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={selectedCategories.includes(category)} onCheckedChange={() => toggleCategory(category)} />
                          <span className="text-xs text-foreground">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Age Rating</h4>
                    <div className="space-y-2">
                      {AGE_RATINGS.map((rating) => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={selectedAgeRatings.includes(rating)} onCheckedChange={() => toggleAgeRating(rating)} />
                          <span className="text-xs text-foreground">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {results.length} {results.length === 1 ? 'result' : 'results'}
                {query && ` for "${query}"`}
              </p>
            </div>
            {loading ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Loading novels...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <SearchIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try searching with different keywords or adjust your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedResults.map((novel, index) => (
                    <NovelCard key={novel.id} novel={novel} index={index} />
                  ))}
                </div>
                <PaginationControls className="mt-10" page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
