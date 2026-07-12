import { AppRoutes } from './app/routes'
import { AppDataProvider } from './app/state/AppDataProvider'

function App() {
  return (
    <AppDataProvider>
      <AppRoutes />
    </AppDataProvider>
  )
}

export default App
