import React from 'react';
import {createRoot} from 'react-dom/client';
import {healthSchema, type Health} from '@dayly/shared';
import './style.css';
function App(){const [health,setHealth]=React.useState<Health>();const [error,setError]=React.useState('');React.useEffect(()=>{const controller=new AbortController();fetch('/api/health',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('API unavailable');return r.json();}).then(data=>setHealth(healthSchema.parse(data))).catch(e=>{if(!controller.signal.aborted)setError(String(e));});return()=>controller.abort();},[]);return <main className="max-w-3xl mx-auto p-margin"><h1 className="font-display text-3xl">DAYLY</h1><section className="bg-white rounded-lg p-gutter mt-8"><h2 className="font-display text-lg">Service status</h2><p role="status">{error|| (health?`API ${health.status} · ${health.version}`:'Checking service…')}</p></section></main>;}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
