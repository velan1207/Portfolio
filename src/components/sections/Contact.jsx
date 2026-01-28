import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiMail, FiPhone, FiMapPin, FiSend, FiGithub, FiLinkedin } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Contact.module.css'

function Contact() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [formData, setFormData] = useState({ name: '', email: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSubmitting(false)
        setSubmitted(true)
        setFormData({ name: '', email: '', message: '' })
        setTimeout(() => setSubmitted(false), 3000)
    }

    const contactInfo = [
        { icon: <FiMail />, label: 'Email', value: data.contact?.email, href: `mailto:${data.contact?.email}` },
        { icon: <FiPhone />, label: 'Phone', value: data.contact?.phone, href: `tel:${data.contact?.phone}` },
        { icon: <FiMapPin />, label: 'Location', value: 'Chennai, India', href: null },
    ]

    const socialLinks = [
        { icon: <FiGithub />, href: data.contact?.github, label: 'GitHub' },
        { icon: <FiLinkedin />, href: data.contact?.linkedin, label: 'LinkedIn' },
    ]

    return (
        <section className={styles.contact} id="contact" ref={ref}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <span className={styles.label}>Get In Touch</span>
                        <h2 className={styles.title}>
                            Let's <span className="text-gradient">Connect</span>
                        </h2>
                        <p className={styles.subtitle}>
                            Have a question or want to work together? Drop me a message!
                        </p>
                    </div>

                    <div className={styles.content}>
                        {/* Contact Info */}
                        <motion.div
                            className={styles.info}
                            initial={{ opacity: 0, x: -30 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className={styles.infoCards}>
                                {contactInfo.map((item, index) => (
                                    <motion.div
                                        key={item.label}
                                        className={styles.infoCard}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                    >
                                        <div className={styles.infoIcon}>{item.icon}</div>
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>{item.label}</span>
                                            {item.href ? (
                                                <a href={item.href} className={styles.infoValue}>
                                                    {item.value}
                                                </a>
                                            ) : (
                                                <span className={styles.infoValue}>{item.value}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className={styles.social}>
                                <h4 className={styles.socialTitle}>Follow Me</h4>
                                <div className={styles.socialLinks}>
                                    {socialLinks.map((link) => link.href && (
                                        <motion.a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={link.label}
                                            className={styles.socialLink}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {link.icon}
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.form
                            className={styles.form}
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, x: 30 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className={styles.inputGroup}>
                                <label htmlFor="name" className={styles.inputLabel}>Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.inputLabel}>Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={styles.input}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="message" className={styles.inputLabel}>Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className={styles.textarea}
                                    placeholder="Your message..."
                                    rows={5}
                                    required
                                />
                            </div>

                            <motion.button
                                type="submit"
                                className={`btn btn-primary ${styles.submitBtn}`}
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSubmitting ? (
                                    <span>Sending...</span>
                                ) : submitted ? (
                                    <span>Message Sent! ✓</span>
                                ) : (
                                    <>
                                        <FiSend /> Send Message
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Contact
