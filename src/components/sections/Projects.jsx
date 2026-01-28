import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { FiSearch, FiExternalLink, FiGithub, FiCalendar, FiPlay, FiImage, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useData } from '../../context/DataContext'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import styles from './Projects.module.css'

function Projects() {
    const { data } = useData()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProject, setSelectedProject] = useState(null)
    const [mediaIndex, setMediaIndex] = useState(0)
    const [showMediaViewer, setShowMediaViewer] = useState(false)

    const projects = data.projects || []

    // Filter projects based on search
    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase()
        return (
            project.title?.toLowerCase().includes(query) ||
            project.desc?.toLowerCase().includes(query) ||
            project.tech?.toLowerCase().includes(query)
        )
    })

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

    // Get all media (photos and videos) for a project
    const getProjectMedia = (project) => {
        const media = []

        // Add thumbnail/cover image (check multiple field names)
        const coverImage = project.thumbnail || project.coverImage || project.cover || project.image || project.img
        if (coverImage) {
            media.push({ type: 'image', url: coverImage, label: 'Cover' })
        }

        // Add demo video (check multiple field names)
        const demoVideo = project.demoVideo || project.demo || project.video || project.videoUrl
        if (demoVideo) {
            media.push({ type: 'video', url: demoVideo, label: 'Demo Video' })
        }

        // Add screenshots/photos array (check multiple field names)
        const screenshots = project.screenshots || project.images || project.photos || project.gallery
        if (screenshots && Array.isArray(screenshots)) {
            screenshots.forEach((item, i) => {
                // Handle both string URLs and objects with url property
                const url = typeof item === 'string' ? item : item.url || item.src
                if (url) {
                    media.push({ type: 'image', url, label: `Screenshot ${i + 1}` })
                }
            })
        }

        // Add videos array
        const videos = project.videos || project.demoVideos
        if (videos && Array.isArray(videos)) {
            videos.forEach((item, i) => {
                const url = typeof item === 'string' ? item : item.url || item.src
                if (url) {
                    media.push({ type: 'video', url, label: `Video ${i + 1}` })
                }
            })
        }

        // Check for 'media' array that contains mixed types
        if (project.media && Array.isArray(project.media)) {
            project.media.forEach((item, i) => {
                const url = typeof item === 'string' ? item : item.url || item.src
                const type = item.type || (url?.match(/\.(mp4|webm|mov|avi)$/i) ? 'video' : 'image')
                if (url) {
                    media.push({ type, url, label: `Media ${i + 1}` })
                }
            })
        }

        return media
    }

    const openMediaViewer = (project, index = 0) => {
        setSelectedProject(project)
        setMediaIndex(index)
        setShowMediaViewer(true)
    }

    const closeMediaViewer = () => {
        setShowMediaViewer(false)
    }

    const nextMedia = () => {
        const media = getProjectMedia(selectedProject)
        setMediaIndex((prev) => (prev + 1) % media.length)
    }

    const prevMedia = () => {
        const media = getProjectMedia(selectedProject)
        setMediaIndex((prev) => (prev - 1 + media.length) % media.length)
    }

    return (
        <section className={styles.projects} id="projects" ref={ref}>
            <div className="container">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {/* Section Header */}
                    <motion.div className={styles.header} variants={cardVariants}>
                        <span className={styles.label}>My Work</span>
                        <h2 className={styles.title}>
                            Featured <span className="text-gradient">Projects</span>
                        </h2>
                        <p className={styles.subtitle}>
                            A collection of projects showcasing my skills and experience
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div className={styles.searchWrapper} variants={cardVariants}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </motion.div>

                    {/* Projects Grid */}
                    <motion.div
                        className={styles.grid}
                        variants={containerVariants}
                    >
                        {filteredProjects.map((project, index) => {
                            const media = getProjectMedia(project)
                            const hasMedia = media.length > 0

                            return (
                                <motion.div
                                    key={project.id || index}
                                    variants={cardVariants}
                                    custom={index}
                                >
                                    <Card
                                        className={styles.projectCard}
                                        onClick={() => setSelectedProject(project)}
                                    >
                                        {/* Project Thumbnail */}
                                        {project.thumbnail && (
                                            <div className={styles.thumbnail}>
                                                <img src={project.thumbnail} alt={project.title} />
                                                {hasMedia && (
                                                    <button
                                                        className={styles.playBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openMediaViewer(project, 0)
                                                        }}
                                                    >
                                                        {project.demoVideo ? <FiPlay /> : <FiImage />}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Project Header */}
                                        <div className={styles.cardHeader}>
                                            <h3 className={styles.projectTitle}>{project.title}</h3>
                                            {project.date && (
                                                <span className={styles.projectDate}>
                                                    <FiCalendar /> {project.date}
                                                </span>
                                            )}
                                        </div>

                                        {/* Tech Stack */}
                                        {project.tech && (
                                            <div className={styles.techStack}>
                                                {project.tech.split(',').map((tech, i) => (
                                                    <span key={i} className={styles.techTag}>
                                                        {tech.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Description Preview */}
                                        <div
                                            className={styles.description}
                                            dangerouslySetInnerHTML={{
                                                __html: project.desc?.substring(0, 150) + '...' || ''
                                            }}
                                        />

                                        {/* Actions */}
                                        <div className={styles.actions}>
                                            <button className={styles.viewBtn}>View Details</button>
                                            {hasMedia && (
                                                <button
                                                    className={styles.mediaBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openMediaViewer(project, 0)
                                                    }}
                                                >
                                                    <FiImage /> {media.length} Media
                                                </button>
                                            )}
                                            {project.link && (
                                                <a
                                                    href={project.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.linkBtn}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FiExternalLink />
                                                </a>
                                            )}
                                            {project.source && (
                                                <a
                                                    href={project.source}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.linkBtn}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FiGithub />
                                                </a>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </motion.div>

                    {/* Empty State */}
                    {filteredProjects.length === 0 && (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <p>No projects found matching "{searchQuery}"</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Project Detail Modal */}
            <Modal
                isOpen={!!selectedProject && !showMediaViewer}
                onClose={() => setSelectedProject(null)}
                title={selectedProject?.title || 'Project'}
            >
                {selectedProject && (
                    <div className={styles.modalContent}>
                        {/* Media Gallery in Modal */}
                        {getProjectMedia(selectedProject).length > 0 && (
                            <div className={styles.mediaGallery}>
                                <div className={styles.mediaGrid}>
                                    {getProjectMedia(selectedProject).slice(0, 4).map((item, i) => (
                                        <div
                                            key={i}
                                            className={styles.mediaThumb}
                                            onClick={() => openMediaViewer(selectedProject, i)}
                                        >
                                            {item.type === 'video' ? (
                                                <div className={styles.videoThumb}>
                                                    <FiPlay />
                                                    <span>Video</span>
                                                </div>
                                            ) : (
                                                <img src={item.url} alt={item.label} />
                                            )}
                                        </div>
                                    ))}
                                    {getProjectMedia(selectedProject).length > 4 && (
                                        <div
                                            className={styles.mediaMore}
                                            onClick={() => openMediaViewer(selectedProject, 4)}
                                        >
                                            +{getProjectMedia(selectedProject).length - 4} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedProject.tech && (
                            <div className={styles.techStack}>
                                {selectedProject.tech.split(',').map((tech, i) => (
                                    <span key={i} className={styles.techTag}>
                                        {tech.trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div
                            className={styles.modalDescription}
                            dangerouslySetInnerHTML={{ __html: selectedProject.desc || '' }}
                        />

                        <div className={styles.modalActions}>
                            {getProjectMedia(selectedProject).length > 0 && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => openMediaViewer(selectedProject, 0)}
                                >
                                    <FiImage /> View Gallery
                                </button>
                            )}
                            {selectedProject.link && (
                                <a
                                    href={selectedProject.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                >
                                    <FiExternalLink /> Visit Project
                                </a>
                            )}
                            {selectedProject.source && (
                                <a
                                    href={selectedProject.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    <FiGithub /> View Source
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Full Screen Media Viewer */}
            <AnimatePresence>
                {showMediaViewer && selectedProject && (
                    <motion.div
                        className={styles.mediaViewer}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <button className={styles.closeViewer} onClick={closeMediaViewer}>
                            <FiX />
                        </button>

                        <div className={styles.viewerContent}>
                            {getProjectMedia(selectedProject).length > 1 && (
                                <button className={styles.navBtn} onClick={prevMedia}>
                                    <FiChevronLeft />
                                </button>
                            )}

                            <div className={styles.mediaDisplay}>
                                {(() => {
                                    const media = getProjectMedia(selectedProject)
                                    const currentMedia = media[mediaIndex]

                                    if (!currentMedia) return null

                                    if (currentMedia.type === 'video') {
                                        return (
                                            <video
                                                controls
                                                autoPlay
                                                className={styles.videoPlayer}
                                            >
                                                <source src={currentMedia.url} />
                                            </video>
                                        )
                                    } else {
                                        return (
                                            <img
                                                src={currentMedia.url}
                                                alt={currentMedia.label}
                                                className={styles.imageDisplay}
                                            />
                                        )
                                    }
                                })()}
                            </div>

                            {getProjectMedia(selectedProject).length > 1 && (
                                <button className={styles.navBtn} onClick={nextMedia}>
                                    <FiChevronRight />
                                </button>
                            )}
                        </div>

                        <div className={styles.mediaCounter}>
                            {mediaIndex + 1} / {getProjectMedia(selectedProject).length}
                        </div>

                        {/* Thumbnail Strip */}
                        <div className={styles.thumbStrip}>
                            {getProjectMedia(selectedProject).map((item, i) => (
                                <div
                                    key={i}
                                    className={`${styles.thumbItem} ${i === mediaIndex ? styles.active : ''}`}
                                    onClick={() => setMediaIndex(i)}
                                >
                                    {item.type === 'video' ? (
                                        <div className={styles.videoThumbSmall}><FiPlay /></div>
                                    ) : (
                                        <img src={item.url} alt={item.label} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}

export default Projects
