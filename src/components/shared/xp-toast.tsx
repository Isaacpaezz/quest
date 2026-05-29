'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp } from 'lucide-react'

// ─── XP Gain Toast ───────────────────────────────────────────────────────────
// Floating "+X XP" animation that appears when XP is earned

export function XpGainToast({ amount, show }: { amount: number; show: boolean }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (show && amount > 0) {
            setVisible(true)
            const timer = setTimeout(() => setVisible(false), 2500)
            return () => clearTimeout(timer)
        }
    }, [show, amount])

    if (!visible) return null

    return (
        <div
            className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg animate-xp-toast"
            style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                backdropFilter: 'blur(12px)',
            }}
        >
            <Star className="size-4" style={{ color: '#10B981' }} />
            <span
                className="text-sm font-bold font-sans"
                style={{ color: '#10B981' }}
            >
                +{amount} XP
            </span>
        </div>
    )
}

// ─── Level Up Notification ───────────────────────────────────────────────────
// Modal-like celebration when user levels up

export function LevelUpNotification({ level, show, onClose }: { level: number; show: boolean; onClose: () => void }) {

    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 4000)
            return () => clearTimeout(timer)
        }
    }, [show, onClose])

    if (!show) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 animate-fade-in"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={onClose}
            />

            {/* Card */}
            <div
                className="relative flex flex-col items-center gap-4 rounded-2xl p-8 shadow-2xl animate-level-up"
                style={{
                    backgroundColor: 'hsl(var(--bg-surface))',
                    border: '2px solid rgba(139, 92, 246, 0.35)',
                    minWidth: 280,
                }}
            >
                {/* Icon */}
                <div
                    className="flex items-center justify-center rounded-full size-16"
                    style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                    }}
                >
                    <TrendingUp className="size-8 text-white" />
                </div>

                {/* Text */}
                <div className="text-center">
                    <p
                        className="text-sm font-sans font-medium mb-1"
                        style={{ color: 'hsl(var(--foreground) / 0.60)' }}
                    >
                        🎉 ¡Felicidades!
                    </p>
                    <h2
                        className="text-2xl font-serif font-bold"
                        style={{ color: 'hsl(var(--foreground))' }}
                    >
                        Nivel {level}
                    </h2>
                    <p
                        className="text-sm font-sans mt-1"
                        style={{ color: '#8B5CF6' }}
                    >
                        Sigue creciendo en tu fe 🙏
                    </p>
                </div>

                {/* Close hint */}
                <button
                    onClick={onClose}
                    className="text-xs font-sans mt-2"
                    style={{ color: 'hsl(var(--foreground) / 0.40)' }}
                >
                    Toca para cerrar
                </button>
            </div>
        </div>
    )
}
