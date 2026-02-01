import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import IndrajaalExtraction from "./pages/IndrajaalExtraction";
import KaalChakraTimeline from "./pages/KaalChakraTimeline";
import SudarshanaDashboard from "./pages/SudarshanaDashboard";
import DivyaDrishtiViewer from "./pages/DivyaDrishtiViewer";
import ChitraguptaDashboard from "./components/DivineScribe/ChitraguptaDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/indrajaal" element={<IndrajaalExtraction />} />
          <Route path="/kaal-chakra" element={<KaalChakraTimeline />} />
          <Route path="/sudarshana" element={<SudarshanaDashboard />} />
          <Route path="/divya-drishti" element={<DivyaDrishtiViewer />} />
          <Route path="/chitragupta" element={<ChitraguptaDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
