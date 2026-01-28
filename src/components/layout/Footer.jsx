import { FiGithub, FiLinkedin, FiMail, FiHeart } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import styles from './Footer.module.css'

function Footer() {
    const { data } = useData()
    const currentYear = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.content}>
                    {/* Branding */}
                    <div className={styles.branding}>
                        <h3 className={styles.logo}>{data.name || 'VELAN.M'}</h3>
                        <p className={styles.tagline}>
                            Aspiring Software Engineer
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.links}>
                        <h4 className={styles.linksTitle}>Quick Links</h4>
                        <nav className={styles.nav}>
                            <a href="/#about">About</a>
                            <a href="/#skills">Skills</a>
                            <a href="/#projects">Projects</a>
                            <a href="/#contact">Contact</a>
                        </nav>
                    </div>

                    {/* Social */}
                    <div className={styles.social}>
                        <h4 className={styles.linksTitle}>Connect</h4>
                        <div className={styles.socialLinks}>
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
                            {data.contact?.email && (
                                <a
                                    href={`mailto:${data.contact.email}`}
                                    aria-label="Email"
                                >
                                    <FiMail />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} {data.name || 'VELAN.M'}. All rights reserved.
                    </p>
                    <p className={styles.madeWith}>
                        Made with <FiHeart className={styles.heart} /> using React
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
