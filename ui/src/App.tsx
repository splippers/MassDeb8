import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ChairProvider } from './context/ChairContext'
import { TitleScreen } from './pages/TitleScreen'
import { Lobby } from './pages/Lobby'
import { Arena } from './pages/Arena'
import { AboutTmi } from './pages/AboutTmi'

export default function App() {
  return (
    <ChairProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/about-tmi" element={<AboutTmi />} />
        </Routes>
      </BrowserRouter>
    </ChairProvider>
  )
}
