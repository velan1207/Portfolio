import { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiDownload, FiArrowDown, FiGithub, FiLinkedin } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Hero.module.css'

function Hero() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    // Typewriter effect text
    const roles = [
        'Full-Stack Developer',
        'React Enthusiast',
        'Problem Solver',
        'Software Engineer'
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
    }

    return (
        <section className={styles.hero} ref={ref}>
            <div className={`container ${styles.container}`}>
                <motion.div
                    className={styles.content}
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {/* Greeting */}
                    <motion.span className={styles.greeting} variants={itemVariants}>
                        👋 Hello, I'm
                    </motion.span>

                    {/* Name */}
                    <motion.h1 className={styles.name} variants={itemVariants}>
                        <span className={styles.nameGradient}>{data.name || 'Velan M'}</span>
                    </motion.h1>

                    {/* Headline */}
                    <motion.p className={styles.headline} variants={itemVariants}>
                        {data.headline || 'Aspiring Software Engineer'}
                    </motion.p>



                    {/* CTA Buttons */}
                    <motion.div className={styles.actions} variants={itemVariants}>
                        <motion.a
                            href={data.resume || '#'}
                            className="btn btn-primary"
                            download
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FiDownload /> Download Resume
                        </motion.a>
                        <motion.a
                            href="#contact"
                            className="btn btn-secondary"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Get in Touch
                        </motion.a>
                    </motion.div>

                    {/* Social Links */}
                    <motion.div className={styles.social} variants={itemVariants}>
                        {data.contact?.github && (
                            <a
                                href={data.contact.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                            >
                                <FiGithub />
                            </a>
                        )}
                        {data.contact?.linkedin && (
                            <a
                                href={data.contact.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                            >
                                <FiLinkedin />
                            </a>
                        )}
                    </motion.div>
                </motion.div>

                {/* Profile Image */}
                <motion.div
                    className={styles.imageWrapper}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className={styles.imageBg} />
                    <motion.img
                        src={data.profile?.image || '/img/velan.jpg'}
                        alt={data.name || 'Profile'}
                        className={styles.image}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className={styles.imageGlow} />
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className={styles.scrollIndicator}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <a href="#about" aria-label="Scroll to About section">
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <FiArrowDown />
                    </motion.div>
                </a>
            </motion.div>
        </section>
    )
}

export default Hero
