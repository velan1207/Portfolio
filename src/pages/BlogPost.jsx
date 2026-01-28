import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiCalendar } from 'react-icons/fi'
import { useData } from '../context/DataContext'
import styles from './BlogPost.module.css'

function BlogPost() {
    const { slug } = useParams()
    const { data } = useData()

    const post = (data.blog || []).find(p => p.slug === slug || p.id === slug)

    if (!post) {
        return (
            <div className={styles.notFound}>
                <div className="container">
                    <h1>Post Not Found</h1>
                    <p>The blog post you're looking for doesn't exist.</p>
                    <Link to="/" className="btn btn-primary">
                        <FiArrowLeft /> Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    const formattedDate = post.date
        ? new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : ''

    return (
        <article className={styles.blogPost}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link to="/" className={styles.backLink}>
                        <FiArrowLeft /> Back to Home
                    </Link>

                    <header className={styles.header}>
                        <h1 className={styles.title}>{post.title}</h1>
                        {formattedDate && (
                            <div className={styles.meta}>
                                <FiCalendar /> {formattedDate}
                            </div>
                        )}
                        {post.tags && (
                            <div className={styles.tags}>
                                {post.tags.map((tag, index) => (
                                    <span key={index} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}
                    </header>

                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: post.content || '' }}
                    />
                </motion.div>
            </div>
        </article>
    )
}

export default BlogPost
