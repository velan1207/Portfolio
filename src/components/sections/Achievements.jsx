import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiAward, FiExternalLink } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Achievements.module.css'

function Achievements() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    const achievements = data.achievements || []

    if (achievements.length === 0) {
        return null
    }

    return (
        <section className={styles.achievements} id="achievements" ref={ref}>
            <div className="container">
                <motion.div
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {/* Header */}
                    <motion.div
                        className={styles.header}
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <span className={styles.label}>Recognition</span>
                        <h2 className={styles.title}>
                            Achievements & <span className="text-gradient">Certifications</span>
                        </h2>
                    </motion.div>

                    {/* Grid */}
                    <div className={styles.grid}>
                        {achievements.map((achievement, index) => (
                            <motion.div
                                key={index}
                                className={styles.card}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                            >
                                <div className={styles.icon}>
                                    <FiAward />
                                </div>
                                <p className={styles.text}>{achievement}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Achievements
