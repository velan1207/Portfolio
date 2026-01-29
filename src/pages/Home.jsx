import { motion } from 'framer-motion'
import Hero from '../components/sections/Hero'
import About from '../components/sections/About'
import Skills from '../components/sections/Skills'
import Projects from '../components/sections/Projects'
import Timeline from '../components/sections/Timeline'
import Internships from '../components/sections/Internships'
import Achievements from '../components/sections/Achievements'
import Contact from '../components/sections/Contact'

function Home() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Hero />
            <About />
            <Skills />
            <Projects />
            <Timeline />
            <Internships />
            <Achievements />
            <Contact />
        </motion.div>
    )
}

export default Home
