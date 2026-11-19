import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import RebuildApp from './rebuild/RebuildApp';
import './index.css';

type BoundaryState = { error: Error | null };
class GameErrorBoundary extends Component<{children:ReactNode}, BoundaryState> {
  state:BoundaryState = {error:null};
  static getDerivedStateFromError(error:Error):BoundaryState { return {error}; }
  componentDidCatch(error:Error, info:ErrorInfo) {
    console.error('Ore & Order 2.0 crashed:',error,info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <main style={{minHeight:'100vh',padding:24,background:'#15232b',color:'#f7ebd1',fontFamily:'system-ui'}}>
      <h1>Ore & Order 2.0 — loading error</h1>
      <p>The game hit an error after character creation. Your character has not been deleted.</p>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',padding:16,background:'#25333d',border:'1px solid #d6ad60'}}>{this.state.error.message}</pre>
      <button onClick={()=>{this.setState({error:null});window.location.reload();}} style={{padding:12}}>Retry game</button>
      <p style={{fontSize:12}}>Please send us the error text above so we can fix the exact cause.</p>
    </main>;
  }
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameErrorBoundary><RebuildApp /></GameErrorBoundary>
  </StrictMode>
);
