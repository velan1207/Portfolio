import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiLogOut, FiUpload, FiPlus, FiTrash2, FiCheck, FiX, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useData } from '../context/DataContext'
import styles from './Admin.module.css'

function Admin() {
    const navigate = useNavigate()
    const {
        data,
        saveData,
        saveProject,
        user,
        isAdmin,
        loading,
        syncing,
        signInWithGoogle,
        signOutUser,
        uploadImage,
        generateId
    } = useData()

    const [formData, setFormData] = useState(data)
    const [saving, setSaving] = useState(false)
    const [popup, setPopup] = useState({ show: false, type: '', message: '' })
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [expandedProjectId, setExpandedProjectId] = useState(null)

    const handleSignIn = async () => {
        try {
            await signInWithGoogle()
        } catch (error) {
            console.error('Sign in failed:', error)
            setPopup({ show: true, type: 'error', message: 'Sign in failed. Please try again.' })
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Save projects to portfolio_projects collection
            const projectPromises = (formData.projects || []).map(project =>
                saveProject(project)
            )
            await Promise.all(projectPromises)

            // Save other data to portfolio_meta
            const dataToSave = { ...formData }
            delete dataToSave.projects // Projects are saved separately
            await saveData(dataToSave)

            setPopup({
                show: true,
                type: 'success',
                message: '✅ All changes saved successfully!'
            })
        } catch (error) {
            console.error('Save failed:', error)
            setPopup({
                show: true,
                type: 'error',
                message: '❌ Failed to save changes. Please try again.'
            })
        } finally {
            setSaving(false)
        }
    }

    const handlePopupClose = () => {
        setPopup({ show: false, type: '', message: '' })
        if (popup.type === 'success') {
            navigate('/')
        }
    }

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateNestedField = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...(prev[parent] || {}), [field]: value }
        }))
    }

    // Project CRUD
    const addProject = () => {
        const newProject = {
            id: generateId(),
            title: 'New Project',
            desc: '',
            tech: 'React, Firebase',
            link: '',
            category: 'Web App'
        }
        setFormData(prev => ({
            ...prev,
            projects: [...(prev.projects || []), newProject]
        }))
    }

    const updateProject = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            )
        }))
    }

    const deleteProject = (id) => {
        setDeleteConfirm(id)
    }

    const confirmDelete = () => {
        if (deleteConfirm) {
            setFormData(prev => ({
                ...prev,
                projects: prev.projects.filter(p => p.id !== deleteConfirm)
            }))
            setDeleteConfirm(null)
        }
    }

    // Stat update
    const updateStat = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            stats: (prev.stats || []).map(s =>
                s.id === id ? { ...s, [field]: value } : s
            )
        }))
    }

    // Skill CRUD
    const addSkill = (type) => {
        const newSkill = { name: 'New Skill', level: 75 }
        setFormData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                [type]: [...(prev.skills?.[type] || []), newSkill]
            }
        }))
    }

    const updateSkill = (type, index, field, value) => {
        setFormData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                [type]: prev.skills[type].map((s, i) =>
                    i === index ? { ...s, [field]: value } : s
                )
            }
        }))
    }

    const deleteSkill = (type, index) => {
        setFormData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                [type]: prev.skills[type].filter((_, i) => i !== index)
            }
        }))
    }

    // Achievement CRUD
    const addAchievement = () => {
        setFormData(prev => ({
            ...prev,
            achievements: [...(prev.achievements || []), 'New Achievement']
        }))
    }

    const updateAchievement = (index, value) => {
        setFormData(prev => ({
            ...prev,
            achievements: prev.achievements.map((a, i) => i === index ? value : a)
        }))
    }

    const deleteAchievement = (index) => {
        setFormData(prev => ({
            ...prev,
            achievements: prev.achievements.filter((_, i) => i !== index)
        }))
    }

    // Timeline CRUD
    const addTimeline = () => {
        const newItem = {
            id: generateId(),
            year: new Date().getFullYear().toString(),
            title: 'New Entry',
            description: '',
            type: 'education'
        }
        setFormData(prev => ({
            ...prev,
            timeline: [...(prev.timeline || []), newItem]
        }))
    }

    const updateTimeline = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            timeline: (prev.timeline || []).map(t =>
                t.id === id ? { ...t, [field]: value } : t
            )
        }))
    }

    const deleteTimeline = (id) => {
        setFormData(prev => ({
            ...prev,
            timeline: (prev.timeline || []).filter(t => t.id !== id)
        }))
    }

    // Internship CRUD
    const addInternship = () => {
        const newItem = {
            id: generateId(),
            company: 'New Company',
            role: 'Intern',
            period: 'Month Year',
            text: '',
            link: ''
        }
        setFormData(prev => ({
            ...prev,
            internships: [...(prev.internships || []), newItem]
        }))
    }

    const updateInternship = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            internships: (prev.internships || []).map(i =>
                i.id === id ? { ...i, [field]: value } : i
            )
        }))
    }

    const deleteInternship = (id) => {
        setFormData(prev => ({
            ...prev,
            internships: (prev.internships || []).filter(i => i.id !== id)
        }))
    }

    // Helper to insert HTML tag around selected text
    const insertTag = (textareaId, tag, field) => {
        const textarea = document.getElementById(textareaId)
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selectedText = text.substring(start, end)

        let newText
        if (tag === 'p') {
            newText = text.substring(0, start) + `<p>${selectedText}</p>` + text.substring(end)
        } else if (tag === 'b') {
            newText = text.substring(0, start) + `<b>${selectedText}</b>` + text.substring(end)
        } else if (tag === 'i') {
            newText = text.substring(0, start) + `<i>${selectedText}</i>` + text.substring(end)
        } else if (tag === 'ul') {
            newText = text.substring(0, start) + `<ul><li>${selectedText}</li></ul>` + text.substring(end)
        } else if (tag === 'li') {
            newText = text.substring(0, start) + `<li>${selectedText}</li>` + text.substring(end)
        } else if (tag === 'br') {
            newText = text.substring(0, start) + `<br/>` + text.substring(end)
        }

        updateField(field, newText)

        // Restore focus
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selectedText.length)
        }, 0)
    }

    // Helper to insert HTML tag for project description
    const insertProjectTag = (projectId, tag) => {
        const textareaId = `desc-${projectId}`
        const textarea = document.getElementById(textareaId)
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selectedText = text.substring(start, end)

        let newText
        if (tag === 'p') {
            newText = text.substring(0, start) + `<p>${selectedText}</p>` + text.substring(end)
        } else if (tag === 'b') {
            newText = text.substring(0, start) + `<b>${selectedText}</b>` + text.substring(end)
        } else if (tag === 'i') {
            newText = text.substring(0, start) + `<i>${selectedText}</i>` + text.substring(end)
        } else if (tag === 'ul') {
            newText = text.substring(0, start) + `<ul><li>${selectedText}</li></ul>` + text.substring(end)
        } else if (tag === 'li') {
            newText = text.substring(0, start) + `<li>${selectedText}</li>` + text.substring(end)
        } else if (tag === 'br') {
            newText = text.substring(0, start) + `<br/>` + text.substring(end)
        }

        updateProject(projectId, 'desc', newText)

        // Restore focus
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selectedText.length)
        }, 0)
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className={styles.admin}>
                <div className="container">
                    <motion.div
                        className={styles.loginCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link to="/" className={styles.backLink}>
                            <FiArrowLeft /> Back to Portfolio
                        </Link>
                        <h1 className={styles.title}>Admin Login</h1>
                        <p className={styles.subtitle}>
                            Sign in with your Google account to edit the portfolio.
                        </p>
                        <button
                            className={`btn btn-primary ${styles.googleBtn}`}
                            onClick={handleSignIn}
                        >
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.07 1.52 7.46 2.78l5.46-5.3C34.8 3.1 29.78 1.5 24 1.5 14.88 1.5 7.38 6.96 4 14.09l6.33 4.92C12.84 12.2 17.97 9.5 24 9.5z" />
                                <path fill="#34A853" d="M46.5 24c0-1.63-.16-3.2-.46-4.7H24v9.05h12.7c-.54 2.92-2.43 5.39-5.18 6.98l7.9 6.08C43.83 37.2 46.5 31.98 46.5 24z" />
                                <path fill="#4A90E2" d="M10.33 29.01A14.98 14.98 0 0 1 9 24c0-1.52.26-3 .74-4.37L3.41 14.7C1.34 18.11.5 21.96.5 26c0 4.05.86 7.9 2.9 11.3l7-8.29z" />
                                <path fill="#FBBC05" d="M24 46.5c6.32 0 11.63-2.09 15.5-5.67l-7.9-6.08c-2.17 1.46-4.95 2.33-7.6 2.33-6.07 0-11.2-3.7-13.66-8.9L4 33.91C7.38 41.04 14.88 46.5 24 46.5z" />
                            </svg>
                            Sign in with Google
                        </button>
                    </motion.div>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className={styles.admin}>
                <div className="container">
                    <motion.div
                        className={styles.loginCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className={styles.title}>Access Denied</h1>
                        <p className={styles.subtitle}>
                            You don't have admin access. Please sign in with the admin account.
                        </p>
                        <p className={styles.email}>Signed in as: {user.email}</p>
                        <button
                            className="btn btn-secondary"
                            onClick={signOutUser}
                        >
                            <FiLogOut /> Sign Out
                        </button>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.admin}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <div>
                            <Link to="/" className={styles.backLink}>
                                <FiArrowLeft /> Back to Portfolio
                            </Link>
                            <h1 className={styles.title}>Portfolio Editor</h1>
                            <p className={styles.email}>Signed in as: {user.email}</p>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving || syncing}
                            >
                                <FiSave /> {saving ? 'Saving...' : syncing ? 'Syncing...' : 'Save Changes'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={signOutUser}
                            >
                                <FiLogOut /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Editor Sections */}
                    <div className={styles.editor}>
                        {/* Basic Info */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Basic Information</h2>
                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Headline</label>
                                    <input
                                        type="text"
                                        value={formData.headline || ''}
                                        onChange={(e) => updateField('headline', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label>About</label>
                                <div className={styles.formatToolbar}>
                                    <button
                                        type="button"
                                        className={styles.formatBtn}
                                        onClick={() => insertTag('about-textarea', 'b', 'about')}
                                        title="Bold"
                                    >
                                        <strong>B</strong>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.formatBtn}
                                        onClick={() => insertTag('about-textarea', 'i', 'about')}
                                        title="Italic"
                                    >
                                        <em>I</em>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.formatBtn}
                                        onClick={() => insertTag('about-textarea', 'p', 'about')}
                                        title="Paragraph"
                                    >
                                        ¶
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.formatBtn}
                                        onClick={() => insertTag('about-textarea', 'ul', 'about')}
                                        title="Bullet List"
                                    >
                                        • List
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.formatBtn}
                                        onClick={() => insertTag('about-textarea', 'li', 'about')}
                                        title="List Item"
                                    >
                                        • Item
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.formatBtn}
                                        onClick={() => insertTag('about-textarea', 'br', 'about')}
                                        title="Line Break"
                                    >
                                        ↵
                                    </button>
                                </div>
                                <textarea
                                    id="about-textarea"
                                    value={formData.about || ''}
                                    onChange={(e) => updateField('about', e.target.value)}
                                    className={styles.textarea}
                                    rows={5}
                                    placeholder="Write about yourself... Select text and click a button to format"
                                />
                                <small className={styles.helpText}>
                                    Select text and click a formatting button, or type HTML directly
                                </small>
                            </div>
                        </section>

                        {/* Stats Boxes */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>About Page Stats</h2>
                            <p className={styles.helpText} style={{ marginBottom: '1rem' }}>
                                Edit the stat boxes displayed in the About section
                            </p>
                            <div className={styles.statsGrid}>
                                {(formData.stats || []).map((stat) => (
                                    <div key={stat.id} className={styles.statEditCard}>
                                        <div className={styles.field}>
                                            <label>Icon</label>
                                            <select
                                                value={stat.icon || 'code'}
                                                onChange={(e) => updateStat(stat.id, 'icon', e.target.value)}
                                                className={styles.input}
                                            >
                                                <option value="code">Code (LeetCode)</option>
                                                <option value="coffee">Coffee (CodeChef)</option>
                                                <option value="award">Award</option>
                                                <option value="users">Users</option>
                                                <option value="star">Star</option>
                                                <option value="briefcase">Briefcase</option>
                                            </select>
                                        </div>
                                        <div className={styles.field}>
                                            <label>Value</label>
                                            <input
                                                type="text"
                                                value={stat.value || ''}
                                                onChange={(e) => updateStat(stat.id, 'value', e.target.value)}
                                                className={styles.input}
                                                placeholder="e.g., 500+"
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>Label</label>
                                            <input
                                                type="text"
                                                value={stat.label || ''}
                                                onChange={(e) => updateStat(stat.id, 'label', e.target.value)}
                                                className={styles.input}
                                                placeholder="e.g., LeetCode Problems"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Profile */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Profile Image</h2>
                            <div className={styles.profileEditor}>
                                <div className={styles.profilePreview}>
                                    {formData.profile?.image ? (
                                        <img
                                            src={formData.profile.image}
                                            alt="Profile Preview"
                                            className={styles.profileImage}
                                        />
                                    ) : (
                                        <div className={styles.profilePlaceholder}>
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className={styles.profileFields}>
                                    <div className={styles.field}>
                                        <label>Profile Image URL</label>
                                        <input
                                            type="url"
                                            value={formData.profile?.image || ''}
                                            onChange={(e) => updateNestedField('profile', 'image', e.target.value)}
                                            className={styles.input}
                                            placeholder="https://firebasestorage.googleapis.com/..."
                                        />
                                        <small className={styles.helpText}>
                                            Upload your image to Firebase Storage and paste the URL here
                                        </small>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Caption (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.profile?.caption || ''}
                                            onChange={(e) => updateNestedField('profile', 'caption', e.target.value)}
                                            className={styles.input}
                                            placeholder="e.g., Software Developer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contact */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Contact Information</h2>
                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.contact?.email || ''}
                                        onChange={(e) => updateNestedField('contact', 'email', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={formData.contact?.phone || ''}
                                        onChange={(e) => updateNestedField('contact', 'phone', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>LinkedIn URL</label>
                                    <input
                                        type="url"
                                        value={formData.contact?.linkedin || ''}
                                        onChange={(e) => updateNestedField('contact', 'linkedin', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>GitHub URL</label>
                                    <input
                                        type="url"
                                        value={formData.contact?.github || ''}
                                        onChange={(e) => updateNestedField('contact', 'github', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label>Resume URL</label>
                                <input
                                    type="text"
                                    value={formData.resume || ''}
                                    onChange={(e) => updateField('resume', e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </section>

                        {/* Projects */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Projects</h2>
                                <button className="btn btn-secondary" onClick={addProject}>
                                    <FiPlus /> Add Project
                                </button>
                            </div>
                            <div className={styles.list}>
                                {(formData.projects || []).map((project) => (
                                    <div key={project.id} className={`${styles.listItem} ${expandedProjectId === project.id ? styles.expanded : ''}`}>
                                        <div
                                            className={styles.projectAccordionHeader}
                                            onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                                        >
                                            <span className={styles.projectTitlePreview}>{project.title || 'Untitled Project'}</span>
                                            <div className={styles.expandIcon}>
                                                {expandedProjectId === project.id ? <FiChevronUp /> : <FiChevronDown />}
                                            </div>
                                        </div>

                                        {expandedProjectId === project.id && (
                                            <div className={styles.projectDetails}>
                                                <div className={styles.grid}>
                                                    <div className={styles.field}>
                                                        <label>Title</label>
                                                        <input
                                                            type="text"
                                                            value={project.title || ''}
                                                            onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                                            className={styles.input}
                                                        />
                                                    </div>
                                                    <div className={styles.field}>
                                                        <label>Tech Stack</label>
                                                        <input
                                                            type="text"
                                                            value={project.tech || ''}
                                                            onChange={(e) => updateProject(project.id, 'tech', e.target.value)}
                                                            className={styles.input}
                                                            placeholder="React, Node.js, Firebase"
                                                        />
                                                    </div>
                                                    <div className={styles.field}>
                                                        <label>Date</label>
                                                        <input
                                                            type="text"
                                                            value={project.date || ''}
                                                            onChange={(e) => updateProject(project.id, 'date', e.target.value)}
                                                            className={styles.input}
                                                            placeholder="Mar 2025"
                                                        />
                                                    </div>
                                                    <div className={styles.field}>
                                                        <label>Live URL</label>
                                                        <input
                                                            type="url"
                                                            value={project.link || ''}
                                                            onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                                                            className={styles.input}
                                                        />
                                                    </div>
                                                    <div className={styles.field}>
                                                        <label>Source URL (GitHub)</label>
                                                        <input
                                                            type="url"
                                                            value={project.source || ''}
                                                            onChange={(e) => updateProject(project.id, 'source', e.target.value)}
                                                            className={styles.input}
                                                        />
                                                    </div>
                                                </div>
                                                <div className={`${styles.field} ${styles.separationField}`}>
                                                    <label>Brief Description</label>
                                                    <textarea
                                                        className={styles.textarea}
                                                        rows={5}
                                                        placeholder="Enter a brief overview of the project..."
                                                        value={(() => {
                                                            // Parse brief from existing HTML
                                                            const html = project.desc || '';
                                                            const pMatch = html.match(/<p>(.*?)<\/p>/i);
                                                            return pMatch ? pMatch[1] : html.split('<ul>')[0].replace(/<[^>]+>/g, '').trim();
                                                        })()}
                                                        onChange={(e) => {
                                                            const newBrief = e.target.value;
                                                            const html = project.desc || '';
                                                            // Extract existing points
                                                            const listMatch = html.match(/<ul>(.*?)<\/ul>/i);
                                                            const existingList = listMatch ? listMatch[0] : '';

                                                            const newDesc = `<p>${newBrief}</p>${existingList}`;
                                                            updateProject(project.id, 'desc', newDesc);
                                                        }}
                                                    />
                                                    <small className={styles.helpText}>Content will be automatically formatted as a paragraph.</small>
                                                </div>

                                                <div className={styles.field}>
                                                    <label>Key Highlights</label>
                                                    <div className={styles.dynamicList}>
                                                        {(() => {
                                                            // Parse points from existing HTML
                                                            const html = project.desc || '';
                                                            const listInside = html.match(/<ul>(.*?)<\/ul>/i);
                                                            const items = listInside ? (listInside[1].match(/<li>(.*?)<\/li>/gi) || []).map(i => i.replace(/<\/?li>/g, '')) : [];

                                                            return items.map((item, index) => (
                                                                <div key={index} className={styles.dynamicItem}>
                                                                    <textarea
                                                                        value={item}
                                                                        onChange={(e) => {
                                                                            const newItems = [...items];
                                                                            newItems[index] = e.target.value;

                                                                            // Reconstruct HTML
                                                                            const pMatch = html.match(/<p>(.*?)<\/p>/i);
                                                                            const existingBrief = pMatch ? pMatch[0] : (html.split('<ul>')[0].trim() ? `<p>${html.split('<ul>')[0].trim()}</p>` : '');
                                                                            const listHtml = newItems.length ? `<ul>${newItems.map(i => `<li>${i}</li>`).join('')}</ul>` : '';
                                                                            updateProject(project.id, 'desc', `${existingBrief}${listHtml}`);
                                                                        }}
                                                                        className={styles.textarea}
                                                                        placeholder="Enter highlight..."
                                                                        rows={2}
                                                                    />
                                                                    <button
                                                                        className={styles.iconBtn}
                                                                        onClick={() => {
                                                                            const newItems = items.filter((_, i) => i !== index);
                                                                            // Reconstruct HTML
                                                                            const pMatch = html.match(/<p>(.*?)<\/p>/i);
                                                                            const existingBrief = pMatch ? pMatch[0] : (html.split('<ul>')[0].trim() ? `<p>${html.split('<ul>')[0].trim()}</p>` : '');
                                                                            const listHtml = newItems.length ? `<ul>${newItems.map(i => `<li>${i}</li>`).join('')}</ul>` : '';
                                                                            updateProject(project.id, 'desc', `${existingBrief}${listHtml}`);
                                                                        }}
                                                                    >
                                                                        <FiX />
                                                                    </button>
                                                                </div>
                                                            ));
                                                        })()}
                                                        <button
                                                            className={`${styles.addBtn} ${styles.smallBtn}`}
                                                            onClick={() => {
                                                                const html = project.desc || '';
                                                                const listInside = html.match(/<ul>(.*?)<\/ul>/i);
                                                                const items = listInside ? (listInside[1].match(/<li>(.*?)<\/li>/gi) || []).map(i => i.replace(/<\/?li>/g, '')) : [];
                                                                const newItems = [...items, ''];

                                                                // Reconstruct HTML
                                                                const pMatch = html.match(/<p>(.*?)<\/p>/i);
                                                                const existingBrief = pMatch ? pMatch[0] : (html.split('<ul>')[0].trim() ? `<p>${html.split('<ul>')[0].trim()}</p>` : '');
                                                                const listHtml = `<ul>${newItems.map(i => `<li>${i}</li>`).join('')}</ul>`;
                                                                updateProject(project.id, 'desc', `${existingBrief}${listHtml}`);
                                                            }}
                                                        >
                                                            <FiPlus /> Add Highlight
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Media Section */}
                                                <div className={styles.mediaSection}>
                                                    <h4 className={styles.mediaTitle}>📷 Project Media</h4>
                                                    <div className={styles.grid}>
                                                        <div className={styles.field}>
                                                            <label>Thumbnail/Cover Image URL</label>
                                                            <input
                                                                type="url"
                                                                value={project.thumbnail || ''}
                                                                onChange={(e) => updateProject(project.id, 'thumbnail', e.target.value)}
                                                                className={styles.input}
                                                                placeholder="https://..."
                                                            />
                                                            {project.thumbnail && (
                                                                <img src={project.thumbnail} alt="Thumbnail preview" className={styles.imagePreview} />
                                                            )}
                                                        </div>
                                                        <div className={styles.field}>
                                                            <label>Demo Video URL</label>
                                                            <input
                                                                type="url"
                                                                value={project.demoVideo || ''}
                                                                onChange={(e) => updateProject(project.id, 'demoVideo', e.target.value)}
                                                                className={styles.input}
                                                                placeholder="https://... (.mp4, .webm)"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Screenshots Array */}
                                                    <div className={styles.field}>
                                                        <label>Screenshots</label>
                                                        <div className={styles.dynamicList}>
                                                            {(project.screenshots || []).map((url, index) => (
                                                                <div key={index} className={styles.dynamicItem}>
                                                                    <input
                                                                        type="url"
                                                                        value={url}
                                                                        onChange={(e) => {
                                                                            const newScreenshots = [...(project.screenshots || [])];
                                                                            newScreenshots[index] = e.target.value;
                                                                            updateProject(project.id, 'screenshots', newScreenshots);
                                                                        }}
                                                                        className={styles.input}
                                                                        placeholder="https://..."
                                                                    />
                                                                    <button
                                                                        className={styles.iconBtn}
                                                                        onClick={() => {
                                                                            const newScreenshots = (project.screenshots || []).filter((_, i) => i !== index);
                                                                            updateProject(project.id, 'screenshots', newScreenshots);
                                                                        }}
                                                                    >
                                                                        <FiX />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                className={`${styles.addBtn} ${styles.smallBtn}`}
                                                                onClick={() => {
                                                                    const newScreenshots = [...(project.screenshots || []), ''];
                                                                    updateProject(project.id, 'screenshots', newScreenshots);
                                                                }}
                                                            >
                                                                <FiPlus /> Add Screenshot
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Screenshot Previews */}
                                                    {(project.screenshots || []).filter(url => url).length > 0 && (
                                                        <div className={styles.screenshotGrid}>
                                                            {(project.screenshots || []).map((url, i) => url ? (
                                                                <div key={i} className={styles.screenshotItem}>
                                                                    <img src={url} alt={`Screenshot ${i + 1}`} />
                                                                    <span>{i + 1}</span>
                                                                </div>
                                                            ) : null)}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => deleteProject(project.id)}
                                                >
                                                    <FiTrash2 /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section >

                        {/* Skills */}
                        < section className={styles.section} >
                            <h2 className={styles.sectionTitle}>Technical Skills</h2>
                            <div className={styles.skillsList}>
                                {(formData.skills?.technical || []).map((skill, index) => (
                                    <div key={index} className={styles.skillItem}>
                                        <input
                                            type="text"
                                            value={skill.name || ''}
                                            onChange={(e) => updateSkill('technical', index, 'name', e.target.value)}
                                            className={styles.input}
                                            placeholder="Skill name"
                                        />
                                        <input
                                            type="number"
                                            value={skill.level || 0}
                                            onChange={(e) => updateSkill('technical', index, 'level', parseInt(e.target.value))}
                                            className={styles.input}
                                            placeholder="Level %"
                                            min="0"
                                            max="100"
                                            style={{ width: '80px' }}
                                        />
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => deleteSkill('technical', index)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-secondary" onClick={() => addSkill('technical')}>
                                <FiPlus /> Add Skill
                            </button>
                        </section >

                        {/* Achievements */}
                        < section className={styles.section} >
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Achievements</h2>
                                <button className="btn btn-secondary" onClick={addAchievement}>
                                    <FiPlus /> Add
                                </button>
                            </div>
                            <div className={styles.skillsList}>
                                {(formData.achievements || []).map((achievement, index) => (
                                    <div key={index} className={styles.skillItem}>
                                        <input
                                            type="text"
                                            value={achievement}
                                            onChange={(e) => updateAchievement(index, e.target.value)}
                                            className={styles.input}
                                        />
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => deleteAchievement(index)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section >

                        {/* Soft Skills */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Soft Skills</h2>
                                <button className="btn btn-secondary" onClick={() => addSkill('soft')}>
                                    <FiPlus /> Add
                                </button>
                            </div>
                            <div className={styles.skillsList}>
                                {(formData.skills?.soft || []).map((skill, index) => (
                                    <div key={index} className={styles.skillItem}>
                                        <input
                                            type="text"
                                            value={skill.name || ''}
                                            onChange={(e) => updateSkill('soft', index, 'name', e.target.value)}
                                            className={styles.input}
                                            placeholder="Soft skill name"
                                        />
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => deleteSkill('soft', index)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Career & Education (Timeline) */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Career & Education</h2>
                                <button className="btn btn-secondary" onClick={addTimeline}>
                                    <FiPlus /> Add Entry
                                </button>
                            </div>
                            <div className={styles.timelineList}>
                                {(formData.timeline || []).map((item) => (
                                    <div key={item.id} className={styles.timelineItem}>
                                        <div className={styles.timelineRow}>
                                            <div className={styles.field}>
                                                <label>Year</label>
                                                <input
                                                    type="text"
                                                    value={item.year || ''}
                                                    onChange={(e) => updateTimeline(item.id, 'year', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="2024"
                                                />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Type</label>
                                                <select
                                                    value={item.type || 'education'}
                                                    onChange={(e) => updateTimeline(item.id, 'type', e.target.value)}
                                                    className={styles.input}
                                                >
                                                    <option value="education">Education</option>
                                                    <option value="work">Work</option>
                                                </select>
                                            </div>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => deleteTimeline(item.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                        <div className={styles.field}>
                                            <label>Title</label>
                                            <input
                                                type="text"
                                                value={item.title || ''}
                                                onChange={(e) => updateTimeline(item.id, 'title', e.target.value)}
                                                className={styles.input}
                                                placeholder="Started B.Tech at..."
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>Description</label>
                                            <input
                                                type="text"
                                                value={item.description || ''}
                                                onChange={(e) => updateTimeline(item.id, 'description', e.target.value)}
                                                className={styles.input}
                                                placeholder="Computer Science and Engineering"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Internships */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Internships & Work</h2>
                                <button className="btn btn-secondary" onClick={addInternship}>
                                    <FiPlus /> Add Internship
                                </button>
                            </div>
                            <div className={styles.internshipList}>
                                {(formData.internships || []).map((item) => (
                                    <div key={item.id} className={styles.internshipItem}>
                                        <div className={styles.internshipHeader}>
                                            <h4>{item.company || 'New Internship'}</h4>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => deleteInternship(item.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                        <div className={styles.grid}>
                                            <div className={styles.field}>
                                                <label>Company</label>
                                                <input
                                                    type="text"
                                                    value={item.company || ''}
                                                    onChange={(e) => updateInternship(item.id, 'company', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="Company Name"
                                                />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Role</label>
                                                <input
                                                    type="text"
                                                    value={item.role || ''}
                                                    onChange={(e) => updateInternship(item.id, 'role', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="Intern Role"
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.grid}>
                                            <div className={styles.field}>
                                                <label>Period</label>
                                                <input
                                                    type="text"
                                                    value={item.period || ''}
                                                    onChange={(e) => updateInternship(item.id, 'period', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="Jun 2024 - Aug 2024"
                                                />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Link (Optional)</label>
                                                <input
                                                    type="url"
                                                    value={item.link || ''}
                                                    onChange={(e) => updateInternship(item.id, 'link', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.field}>
                                            <label>Description</label>
                                            <textarea
                                                value={item.text || ''}
                                                onChange={(e) => updateInternship(item.id, 'text', e.target.value)}
                                                className={styles.textarea}
                                                rows={3}
                                                placeholder="What you did during the internship..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div >
                </motion.div >
            </div >

            {/* Popup Modal */}
            < AnimatePresence >
                {
                    popup.show && (
                        <motion.div
                            className={styles.popupOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handlePopupClose}
                        >
                            <motion.div
                                className={`${styles.popup} ${styles[popup.type]}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={styles.popupIcon}>
                                    {popup.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                </div>
                                <p className={styles.popupMessage}>{popup.message}</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePopupClose}
                                >
                                    {popup.type === 'success' ? 'Go to Portfolio' : 'Try Again'}
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* Delete Confirmation Modal */}
                {
                    deleteConfirm && (
                        <motion.div
                            className={styles.popupOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                        >
                            <motion.div
                                className={styles.popup}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={`${styles.popupIcon} ${styles.error}`}>
                                    <FiAlertCircle />
                                </div>
                                <h3 className={styles.popupTitle}>Confirm Deletion</h3>
                                <p className={styles.popupMessage}>
                                    Are you sure you want to remove this project? This action cannot be undone.
                                </p>
                                <div className={styles.popupActions}>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => setDeleteConfirm(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={styles.confirmDeleteBtn}
                                        onClick={confirmDelete}
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    )
}

export default Admin
