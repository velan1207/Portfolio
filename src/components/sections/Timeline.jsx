import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiBriefcase, FiBookOpen } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Timeline.module.css'

function Timeline() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    const timelineItems = data.timeline || []

    if (timelineItems.length === 0) {
        return null
    }

    return (
        <section className={styles.timeline} id="timeline" ref={ref}>
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
                        <span className={styles.label}>My Journey</span>
                        <h2 className={styles.title}>
                            Career & <span className="text-gradient">Education</span>
                        </h2>
                    </motion.div>

                    {/* Timeline */}
                    <div className={styles.timelineWrapper}>
                        <div className={styles.line} />

                        {timelineItems.map((item, index) => (
                            <motion.div
                                key={item.id || index}
                                className={`${styles.item} ${index % 2 === 0 ? styles.left : styles.right}`}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.year}>{item.year}</span>
                                        <div className={styles.icon}>
                                            {item.type === 'work' ? <FiBriefcase /> : <FiBookOpen />}
                                        </div>
                                    </div>
                                    <h3 className={styles.itemTitle}>{item.title}</h3>
                                    <p className={styles.itemDesc}>{item.description}</p>
                                </div>
                                <div className={styles.dot} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Timeline
