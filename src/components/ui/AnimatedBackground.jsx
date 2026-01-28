import styles from './AnimatedBackground.module.css'

function AnimatedBackground() {
    return (
        <div className={styles.background} aria-hidden="true">
            {/* Gradient blobs */}
            <div className={`${styles.blob} ${styles.blob1}`} />
            <div className={`${styles.blob} ${styles.blob2}`} />
            <div className={`${styles.blob} ${styles.blob3}`} />

            {/* Grid pattern */}
            <div className={styles.grid} />
        </div>
    )
}

export default AnimatedBackground
