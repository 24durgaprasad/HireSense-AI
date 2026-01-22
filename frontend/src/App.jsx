import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import JobPage from './pages/JobPage';
import CandidatePage from './pages/CandidatePage';

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/jobs/:jobId" element={<JobPage />} />
                <Route path="/jobs/:jobId/candidates/:candidateId" element={<CandidatePage />} />
            </Routes>
        </Layout>
    );
}

export default App;
