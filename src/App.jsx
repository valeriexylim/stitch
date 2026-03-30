import { useState } from 'react'
import './App.css'
import BlockBuilder from './components/builder/BlockBuilder.jsx'
import CheckerScreen from './components/checker/CheckerScreen.jsx'
import SimplifierScreen from './components/simplifier/SimplifierScreen.jsx'
import ProofChecker from './components/proof/ProofChecker.jsx'

const SCREENS = ['builder', 'checker', 'simplifier', 'proof']

const SCREEN_LABELS = {
  builder: 'Block Builder',
  checker: 'Truth Table / SAT',
  simplifier: 'Simplification',
  proof: 'Proof Checker',
}

export default function App() {
  const [screen, setScreen] = useState('builder')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Stitch</h1>
        <p className="app-subtitle">Visual Propositional Logic</p>
        <nav className="app-nav">
          {SCREENS.map((s) => (
            <button
              key={s}
              className={`nav-btn ${screen === s ? 'active' : ''}`}
              onClick={() => setScreen(s)}
            >
              {SCREEN_LABELS[s]}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {screen === 'builder'    && <BlockBuilder />}
        {screen === 'checker'    && <CheckerScreen />}
        {screen === 'simplifier' && <SimplifierScreen />}
        {screen === 'proof'      && <ProofChecker />}
      </main>
    </div>
  )
}
