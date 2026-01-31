import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ViewSwitcher from './components/ViewSwitcher';
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
    // Generate 700 realistic events
    const events = generateMockEvents(700);
    setEvents(events);
    console.log(`Loaded ${events.length} mock events from 7 sources`);
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
        <ViewSwitcher />
        <Routes>
          <Route path="/" element={renderActiveView()} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
