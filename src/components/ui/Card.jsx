import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import styles from './Card.module.css'

const Card = forwardRef(({
    children,
    className = '',
    variant = 'glass',
    hover = true,
    onClick,
    ...props
}, ref) => {
    const cardClasses = `
    ${styles.card} 
    ${styles[variant]} 
    ${hover ? styles.hoverable : ''} 
    ${className}
  `.trim()

    const MotionDiv = motion.div

    return (
        <MotionDiv
            ref={ref}
            className={cardClasses}
            onClick={onClick}
            whileHover={hover ? { y: -8, scale: 1.02 } : {}}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {children}
        </MotionDiv>
    )
})

Card.displayName = 'Card'

export default Card
