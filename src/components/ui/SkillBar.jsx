import { motion } from 'framer-motion'
import styles from './SkillBar.module.css'

function SkillBar({ name, level = 0, delay = 0 }) {
    return (
        <div className={styles.skillBar}>
            <div className={styles.header}>
                <span className={styles.name}>{name}</span>
                <span className={styles.level}>{level}%</span>
            </div>
            <div className={styles.track}>
                <motion.div
                    className={styles.fill}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${level}%` }}
                    viewport={{ once: true }}
                    transition={{
                        duration: 1,
                        delay,
                        ease: [0.34, 1.56, 0.64, 1]
                    }}
                />
            </div>
        </div>
    )
}

export default SkillBar
