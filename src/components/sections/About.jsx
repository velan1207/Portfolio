import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiCode, FiCoffee, FiAward, FiUsers } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './About.module.css'

function About() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    const stats = [
        { icon: <FiCode />, value: '500+', label: 'LeetCode Problems' },
        { icon: <FiCoffee />, value: '1000+', label: 'CodeChef Problems' },
        { icon: <FiAward />, value: '5+', label: 'Projects' },
        { icon: <FiUsers />, value: '1', label: 'Internship' },
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

    return (
        <section className={styles.about} id="about" ref={ref}>
            <div className="container">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {/* Section Header */}
                    <motion.div className={styles.header} variants={itemVariants}>
                        <span className={styles.label}>About Me</span>
                        <h2 className={styles.title}>
                            Passionate Developer Building
                            <span className="text-gradient"> Digital Experiences</span>
                        </h2>
                    </motion.div>

                    <div className={styles.content}>
                        {/* About Text */}
                        <motion.div className={styles.text} variants={itemVariants}>
                            <div
                                className={styles.description}
                                dangerouslySetInnerHTML={{ __html: data.about || '' }}
                            />
                            <p className={styles.caption}>
                                {data.profile?.caption || 'Student at Chennai Institute Of Technology'}
                            </p>
                        </motion.div>

                        {/* Stats */}
                        <motion.div className={styles.stats} variants={itemVariants}>
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    className={styles.statCard}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className={styles.statIcon}>{stat.icon}</div>
                                    <div className={styles.statValue}>{stat.value}</div>
                                    <div className={styles.statLabel}>{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default About
