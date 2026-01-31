import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ViewSwitcher from './components/ViewSwitcher';
import CosmicWheel from './components/CosmicWheel';
import { useTimeStore } from './store/timeStore';

import MapView from './components/views/MapView';
import LinearView from './components/views/LinearView';
import HeatmapView from './components/views/HeatmapView';

import DataLogView from './components/views/DataLogView';

// Placeholder Views for now

function App() {
  const fetchEvents = useTimeStore((state) => state.fetchEvents);
  const viewMode = useTimeStore((state) => state.viewMode);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const renderActiveView = () => {
    switch (viewMode) {
      case 'circular': return <CosmicWheel />;
      case 'linear': return <LinearView />;
      case 'map': return <MapView />;
      case 'heatmap': return <HeatmapView />;
      case 'datalog': return <DataLogView />;
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
