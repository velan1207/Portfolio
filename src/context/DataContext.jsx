import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { initializeApp } from 'firebase/app'
import {
    getFirestore,
    doc,
    collection,
    onSnapshot,
    setDoc,
    deleteDoc,
    getDocs,
    serverTimestamp
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Firebase configuration (same as original)
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD0KmDOYkBgaWmherPgupciFlrUNoTpL1s",
    authDomain: "portfolio-f1b31.firebaseapp.com",
    projectId: "portfolio-f1b31",
    storageBucket: "portfolio-f1b31.firebasestorage.app",
    messagingSenderId: "831274339687",
    appId: "1:831274339687:web:8fb7be5fdc341ec41033c2",
    measurementId: "G-69W84YT32Q"
}

const ADMIN_EMAIL = 'velanm.cse2024@citchennai.net'
const STORAGE_KEY = 'portfolio:data:v1'

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)
const googleProvider = new GoogleAuthProvider()

// Default portfolio data
const defaultData = {
    name: 'Velan M',
    headline: 'Aspiring Software Engineer — Full-stack web & backend',
    about: '<p>Aspiring Software Engineer skilled in full-stack web development (React, Node), backend APIs and algorithms. Solved 400+ LeetCode and 900+ CodeChef problems.</p>',
    projects: [
        {
            id: '1',
            title: 'PedalPulse — Urban Bike Rental Feedback App',
            desc: '<p>Developed a web-based platform to collect and analyze feedback from urban bike rental users.</p>',
            tech: 'Firebase, React, Node',
            date: 'Sep 2025',
            link: '',
            source: ''
        },
        {
            id: '2',
            title: 'Weather Prediction Website',
            desc: '<p>Responsive weather forecast website with live updates from OpenWeatherMap API.</p>',
            tech: 'Node.js, OpenWeatherMap',
            date: 'Mar 2025',
            link: '',
            source: ''
        }
    ],
    skills: {
        technical: [
            { name: 'C/C++', level: 85 },
            { name: 'Python', level: 80 },
            { name: 'JavaScript', level: 90 },
            { name: 'React.js', level: 85 },
            { name: 'Node.js', level: 80 },
            { name: 'Firebase', level: 75 },
            { name: 'Git', level: 85 },
            { name: 'Data Structures', level: 90 }
        ],
        soft: [
            { name: 'Problem Solving' },
            { name: 'Teamwork' },
            { name: 'Communication' }
        ]
    },
    achievements: [
        'AWS Cloud Practitioner certification',
        'Solved 400+ LeetCode and 900+ CodeChef problems',
        'Participant — All India Developers Challenge 2025'
    ],
    internships: [
        {
            id: '1',
            company: 'AICTE–EduSkills Virtual Internship',
            role: 'Android App Development Intern',
            period: 'Jun 2025',
            text: '<p>Built Flutter apps including calculator and to-do applications.</p>',
            link: ''
        }
    ],
    testimonials: [
        {
            id: '1',
            name: 'John Doe',
            role: 'Senior Developer',
            company: 'Tech Corp',
            text: 'Velan is an exceptional developer with great problem-solving skills.',
            avatar: ''
        }
    ],
    timeline: [
        {
            id: '1',
            year: '2024',
            title: 'Started B.Tech at Chennai Institute of Technology',
            description: 'Computer Science and Engineering',
            type: 'education'
        },
        {
            id: '2',
            year: '2025',
            title: 'AICTE-EduSkills Internship',
            description: 'Android App Development',
            type: 'work'
        }
    ],
    blog: [],
    profile: {
        image: '/img/velan.jpg',
        caption: 'Student at Chennai Institute Of Technology'
    },
    resume: '/img/Velan_M_Resume 11-10-2025.pdf',
    contact: {
        email: 'velanm.cse2024@citchennai.net',
        phone: '+91 7904092680',
        linkedin: 'https://linkedin.com/in/velan-m-58059932a',
        github: 'https://github.com/velan1207'
    },
    lastUpdate: Date.now()
}

const DataContext = createContext()

export function DataProvider({ children }) {
    // Always start with defaultData, then try to merge saved data
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                // Only use saved data if it has actual content
                return {
                    ...defaultData,
                    ...parsed,
                    // Ensure defaults for arrays if saved is empty
                    projects: parsed?.projects?.length > 0 ? parsed.projects : defaultData.projects,
                    skills: {
                        technical: parsed?.skills?.technical?.length > 0 ? parsed.skills.technical : defaultData.skills.technical,
                        soft: parsed?.skills?.soft?.length > 0 ? parsed.skills.soft : defaultData.skills.soft,
                    },
                    achievements: parsed?.achievements?.length > 0 ? parsed.achievements : defaultData.achievements,
                    internships: parsed?.internships?.length > 0 ? parsed.internships : defaultData.internships,
                    testimonials: parsed?.testimonials?.length > 0 ? parsed.testimonials : defaultData.testimonials,
                    timeline: parsed?.timeline?.length > 0 ? parsed.timeline : defaultData.timeline,
                    profile: { ...defaultData.profile, ...parsed?.profile },
                    contact: { ...defaultData.contact, ...parsed?.contact },
                }
            }
            return defaultData
        } catch {
            return defaultData
        }
    })

    const [user, setUser] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser)
            setIsAdmin(firebaseUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Firestore realtime listener for portfolio meta
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'portfolio_meta', 'main'),
            (snapshot) => {
                if (snapshot.exists()) {
                    const firebaseData = snapshot.data()
                    // Deep merge: use defaultData as base, then apply Firebase data
                    const merged = {
                        ...defaultData,
                        ...firebaseData,
                        // Ensure nested objects merge properly
                        profile: { ...defaultData.profile, ...firebaseData?.profile },
                        contact: { ...defaultData.contact, ...firebaseData?.contact },
                        skills: {
                            technical: firebaseData?.skills?.technical?.length > 0
                                ? firebaseData.skills.technical
                                : defaultData.skills.technical,
                            soft: firebaseData?.skills?.soft?.length > 0
                                ? firebaseData.skills.soft
                                : defaultData.skills.soft,
                        },
                        achievements: firebaseData?.achievements?.length > 0
                            ? firebaseData.achievements
                            : defaultData.achievements,
                        internships: firebaseData?.internships?.length > 0
                            ? firebaseData.internships
                            : defaultData.internships,
                        testimonials: firebaseData?.testimonials?.length > 0
                            ? firebaseData.testimonials
                            : defaultData.testimonials,
                        timeline: firebaseData?.timeline?.length > 0
                            ? firebaseData.timeline
                            : defaultData.timeline,
                    }
                    setData(prev => ({ ...prev, ...merged }))
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, ...merged }))
                }
            },
            (error) => {
                console.warn('Firestore listener error:', error)
            }
        )
        return () => unsubscribe()
    }, [])

    // Firestore realtime listener for portfolio_project collection
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'portfolio_projects'),
            (snapshot) => {
                const projects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                console.log('Fetched projects from collection:', projects.length)
                setData(prev => {
                    const updated = { ...prev, projects }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                    return updated
                })
            },
            (error) => {
                console.warn('Projects collection listener error:', error)
            }
        )
        return () => unsubscribe()
    }, [])

    // Save data locally and to Firebase
    const saveData = useCallback(async (newData) => {
        const updated = { ...data, ...newData, lastUpdate: Date.now() }
        setData(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

        if (isAdmin && user) {
            setSyncing(true)
            try {
                await setDoc(doc(db, 'portfolio_meta', 'main'), updated, { merge: true })
            } catch (error) {
                console.error('Failed to sync to Firebase:', error)
            }
            setSyncing(false)
        }
    }, [data, isAdmin, user])

    // Auth methods
    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            return result.user
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        }
    }

    const signOutUser = async () => {
        try {
            await signOut(auth)
        } catch (error) {
            console.error('Sign out error:', error)
        }
    }

    // Upload image to Firebase Storage
    const uploadImage = async (file, path) => {
        if (!file || !storage) return null
        try {
            const storageRef = ref(storage, path)
            await uploadBytes(storageRef, file)
            const url = await getDownloadURL(storageRef)
            return url
        } catch (error) {
            console.error('Upload error:', error)
            return null
        }
    }

    // Helper to generate unique IDs
    const generateId = () => Math.random().toString(36).slice(2, 9)

    // CRUD operations for portfolio_project collection
    const saveProject = async (projectData) => {
        if (!isAdmin || !user) return null

        const projectId = projectData.id || generateId()
        const projectWithId = { ...projectData, id: projectId, updatedAt: Date.now() }

        try {
            await setDoc(doc(db, 'portfolio_projects', projectId), projectWithId, { merge: true })
            return projectId
        } catch (error) {
            console.error('Failed to save project:', error)
            return null
        }
    }

    const deleteProject = async (projectId) => {
        if (!isAdmin || !user) return false

        try {
            await deleteDoc(doc(db, 'portfolio_projects', projectId))
            return true
        } catch (error) {
            console.error('Failed to delete project:', error)
            return false
        }
    }

    // Upload file (image or video) to Firebase Storage
    const uploadFile = async (file, path) => {
        if (!file || !storage || !isAdmin) return null
        try {
            const storageRef = ref(storage, path)
            await uploadBytes(storageRef, file)
            const url = await getDownloadURL(storageRef)
            return url
        } catch (error) {
            console.error('Upload error:', error)
            return null
        }
    }

    const addBlogPost = (post) => {
        const newPost = { ...post, id: generateId(), date: Date.now() }
        saveData({ blog: [...(data.blog || []), newPost] })
    }

    const addTestimonial = (testimonial) => {
        const newTestimonial = { ...testimonial, id: generateId() }
        saveData({ testimonials: [...(data.testimonials || []), newTestimonial] })
    }

    const value = {
        data,
        setData,
        saveData,
        user,
        isAdmin,
        loading,
        syncing,
        signInWithGoogle,
        signOutUser,
        uploadImage,
        uploadFile,
        generateId,
        saveProject,
        deleteProject,
        addBlogPost,
        addTestimonial,
    }

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const context = useContext(DataContext)
    if (!context) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}

export default DataContext
