import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiBriefcase, FiExternalLink } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Internships.module.css'

function Internships() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    const internships = data.internships || []

    if (internships.length === 0) {
        return null
    }

    return (
        <section className={styles.internships} id="internships" ref={ref}>
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
                        <span className={styles.label}>Experience</span>
                        <h2 className={styles.title}>
                            Internships & <span className="text-gradient">Work</span>
                        </h2>
                    </motion.div>

                    {/* Cards */}
                    <div className={styles.grid}>
                        {internships.map((internship, index) => (
                            <motion.div
                                key={internship.id || index}
                                className={styles.card}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.icon}>
                                        <FiBriefcase />
                                    </div>
                                    <div className={styles.headerInfo}>
                                        <h3 className={styles.company}>{internship.company}</h3>
                                        <span className={styles.role}>{internship.role}</span>
                                        {internship.period && (
                                            <span className={styles.period}>{internship.period}</span>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={styles.description}
                                    dangerouslySetInnerHTML={{ __html: internship.text || '' }}
                                />

                                {internship.link && (
                                    <a
                                        href={internship.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.link}
                                    >
                                        <FiExternalLink /> View Details
                                    </a>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Internships
