

import { Route, Routes } from 'react-router-dom'
import Home from './pages'
import Launchpad from './pages/launchpad'
import Explore from './pages/explore'
import Whitelist from './pages/whitelist'
import Staking from './pages/staking'
import NewPool from './pages/staking/new'
import Single from './pages/staking/single'
import Dashboard from './pages/dashboard'
import Governance from './pages/governance'
import DynamicRewards from './pages/dynamic'
import Leaderboard from './pages/leaderboard'
import SeasonalStaking from './pages/seasonal-staking'
import PresaleCreator from './pages/presale/create'
import IDO from './pages/ido'
import AdminAuthScreen from './pages/admin'
import Ido from './pages/ido'

function App() {

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/launchpad' element={<Launchpad />} />
      <Route path='/launchpad/:id' element={<IDO />} />
      <Route path='/explore' element={<Explore />} />
      <Route path='/join-ido' element={<Ido/>}/>
      <Route path='/stake-farm' element={<Staking />} />
      <Route path='/presale/create' element={<PresaleCreator />} />
      <Route path='/stake-farm/:id' element={<Single />} />
      <Route path='/stake-farm/new' element={<NewPool />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/governance' element={<Governance />} />
      <Route path='/leaderboard' element={<Leaderboard />} />
      <Route path='/dynamic-rewards' element={<DynamicRewards />} />
      <Route path='/seasonal-staking' element={<SeasonalStaking />} />
      <Route path='/admin' element={<AdminAuthScreen />} />
    </Routes>
  )
}

export default App
