import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'
import App from './App'

// Global styles
import './styles/variables.css'
import './styles/globals.css'
import './styles/animations.css'

const root = document.getElementById('root')

createRoot(root).render(
    <StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ThemeProvider>
                <DataProvider>
                    <App />
                </DataProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
)
