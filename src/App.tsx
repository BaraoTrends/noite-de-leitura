import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NovelDetail from "./pages/NovelDetail";
import Categories from "./pages/Categories";
import Category from "./pages/Category";
import NarratedNovels from "./pages/NarratedNovels";
import Popular from "./pages/Popular";
import NewReleases from "./pages/NewReleases";
import Search from "./pages/Search";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AuthorProfile from "./pages/AuthorProfile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminNovels from "./pages/admin/AdminNovels";
import NovelEditor from "./pages/admin/NovelEditor";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAuthors from "./pages/admin/AdminAuthors";
import AdminComments from "./pages/admin/AdminComments";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSeo from "./pages/admin/AdminSeo";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminVisualEdits from "./pages/admin/AdminVisualEdits";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/autor/:id" element={<AuthorProfile />} />
            <Route path="/auth" element={<Auth />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/novels" element={<AdminNovels />} />
            <Route path="/admin/novels/:id" element={<NovelEditor />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/authors" element={<AdminAuthors />} />
            <Route path="/admin/comments" element={<AdminComments />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/seo" element={<AdminSeo />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/visual-edits" element={<AdminVisualEdits />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
