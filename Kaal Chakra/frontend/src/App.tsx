import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ViewSwitcher from './components/ViewSwitcher';
import ExtractionPanel from './components/ExtractionPanel';
import CosmicWheel from './components/CosmicWheel';
import { useTimeStore } from './store/timeStore';
import { generateMockEvents } from './utils/mockData';

import MapView from './components/views/MapView';
import LinearView from './components/views/LinearView';
import HeatmapView from './components/views/HeatmapView';

// Placeholder Views for now

function App() {
  const setEvents = useTimeStore((state) => state.setEvents);
  const viewMode = useTimeStore((state) => state.viewMode);

  useEffect(() => {
    // Attempt to fetch from backend
    const fetchData = async () => {
      try {
        // Try getting real data first
        const response = await fetch('http://localhost:5000/api/timeline?mode=real');

        if (response.ok) {
          const realData = await response.json();
          if (Array.isArray(realData) && realData.length > 0) {
            setEvents(realData);
            console.log(`Loaded ${realData.length} events from REAL extraction.`);
            return;
          }
        }

        // If real data empty or failed, try demo mode from API
        console.warn("Real data fetch failed or empty. Trying Demo Mode API...");
        const demoResponse = await fetch('http://localhost:5000/api/timeline?mode=demo');
        if (demoResponse.ok) {
          const demoData = await demoResponse.json();
          setEvents(demoData);
          console.log(`Loaded ${demoData.length} events from DEMO API.`);
          return;
        }

      } catch (err) {
        console.error("API Fetch failed completely. Falling back to local mock data.", err);
      }

      // Final Fallback: Local Mock Data (Pure frontend)
      const mockEvents = generateMockEvents(100);
      setEvents(mockEvents);
      console.log(`Loaded ${mockEvents.length} events from LOCAL MOCK FALLBACK.`);
    };

    fetchData();
  }, [setEvents]);

  const renderActiveView = () => {
    switch (viewMode) {
      case 'circular': return <CosmicWheel />;
      case 'linear': return <LinearView />;
      case 'map': return <MapView />;
      case 'heatmap': return <HeatmapView />;
      default: return <CosmicWheel />;
    }
  };

  return (
    <Router>
      <Layout>
        <ExtractionPanel />
        <ViewSwitcher />
        <Routes>
          <Route path="/" element={renderActiveView()} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
