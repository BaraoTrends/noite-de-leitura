import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NovelDetail from "./pages/NovelDetail";
import Categories from "./pages/Categories";
import Category from "./pages/Category";
import NarratedNovels from "./pages/NarratedNovels";
import Popular from "./pages/Popular";
import NewReleases from "./pages/NewReleases";
import Search from "./pages/Search";
import About from "./pages/About";
import AuthorProfile from "./pages/AuthorProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/novel/:id" element={<NovelDetail />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/categoria/:category" element={<Category />} />
          <Route path="/narradas" element={<NarratedNovels />} />
          <Route path="/populares" element={<Popular />} />
          <Route path="/novos" element={<NewReleases />} />
          <Route path="/busca" element={<Search />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/autor/:id" element={<AuthorProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
