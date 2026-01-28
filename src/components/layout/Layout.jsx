import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import AnimatedBackground from '../ui/AnimatedBackground'
import styles from './Layout.module.css'

function Layout() {
    const location = useLocation()

    return (
        <div className={styles.layout}>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <AnimatedBackground />
            <Header />
            <motion.main
                id="main-content"
                className={styles.main}
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <Outlet />
            </motion.main>
            <Footer />
        </div>
    )
}

export default Layout
