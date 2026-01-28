import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Testimonials.module.css'

function Testimonials() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [currentIndex, setCurrentIndex] = useState(0)

    const testimonials = data.testimonials || []

    // Auto-advance carousel
    useEffect(() => {
        if (testimonials.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [testimonials.length])

    if (testimonials.length === 0) {
        return null
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }

    return (
        <section className={styles.testimonials} id="testimonials" ref={ref}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <span className={styles.label}>Testimonials</span>
                        <h2 className={styles.title}>
                            What People <span className="text-gradient">Say</span>
                        </h2>
                    </div>

                    {/* Carousel */}
                    <div className={styles.carousel}>
                        <button
                            className={styles.navBtn}
                            onClick={prevSlide}
                            aria-label="Previous testimonial"
                        >
                            <FiChevronLeft />
                        </button>

                        <div className={styles.carouselContent}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    className={styles.card}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <FiMessageCircle className={styles.quoteIcon} />
                                    <p className={styles.text}>
                                        "{testimonials[currentIndex].text}"
                                    </p>
                                    <div className={styles.author}>
                                        {testimonials[currentIndex].avatar && (
                                            <img
                                                src={testimonials[currentIndex].avatar}
                                                alt={testimonials[currentIndex].name}
                                                className={styles.avatar}
                                            />
                                        )}
                                        <div className={styles.authorInfo}>
                                            <span className={styles.name}>
                                                {testimonials[currentIndex].name}
                                            </span>
                                            <span className={styles.role}>
                                                {testimonials[currentIndex].role}
                                                {testimonials[currentIndex].company && ` at ${testimonials[currentIndex].company}`}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button
                            className={styles.navBtn}
                            onClick={nextSlide}
                            aria-label="Next testimonial"
                        >
                            <FiChevronRight />
                        </button>
                    </div>

                    {/* Dots */}
                    <div className={styles.dots}>
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Testimonials
