'use client'

import { CheckCircle2, Minus, ShieldAlert, Check, BookOpen, Timer, Flame } from 'lucide-react'
import { CommunityMember } from '@/types/definitions'

// ── Leaderboard row ───────────────────────────────────────────────────────────
function RankRow({
  user, rank,
}: {
  user: CommunityMember
  rank: number
}) {
  const cardBg = 'hsl(var(--bg-surface) / 0.60)'
  const border = 'hsl(var(--border))'
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'
  const accentClr = 'hsl(var(--primary))'
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const rankColor = rankColors[rank - 1] || subClr
  const dotBg = 'hsl(var(--muted))'

  return (
    <div
      className="flex items-center gap-3 rounded-[20px] p-4"
      style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
    >
      {/* Rank */}
      <span
        className="font-display text-[18px] font-bold w-7 text-center shrink-0"
        style={{ color: rank <= 3 ? rankColor : subClr }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div
        className="size-10 rounded-full flex items-center justify-center text-[14px] font-bold font-display shrink-0"
        style={{ backgroundColor: dotBg, color: subClr }}
      >
        {user.nombre_usuario[0]?.toUpperCase()}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-[600] font-sans block truncate" style={{ color: textClr }}>
          {user.nombre_usuario}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <BookOpen className="size-3" style={{ color: subClr }} />
          <span className="text-[11px] font-sans" style={{ color: subClr }}>
            {user.progresoHoy?.lectura_completada ? 'Lectura ✓' : 'Pendiente'}
          </span>
          <span style={{ color: subClr }} className="text-[10px]">·</span>
          <Timer className="size-3" style={{ color: subClr }} />
          <span className="text-[11px] font-sans" style={{ color: subClr }}>
            {user.progresoHoy?.oracion_completada ? 'Oración ✓' : 'Pendiente'}
          </span>
        </div>
      </div>

      {/* Streak + completion */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold font-sans" style={{ color: '#FF6B35' }}>🔥</span>
          <span className="text-[13px] font-bold font-sans" style={{ color: '#FF6B35' }}>
            {user.streak}
          </span>
        </div>
        {/* Green bar matching Pencil */}
        <div
          className="h-[3px] rounded-full"
          style={{
            width: 40,
            backgroundColor: (user.progresoHoy?.lectura_completada && user.progresoHoy?.oracion_completada)
              ? accentClr
              : 'hsl(var(--muted))',
          }}
        />
      </div>
    </div>
  )
}

export function CommunityClient({ communityData, highestStreak, nombreGrupo }: { communityData: CommunityMember[]; highestStreak: { nombre_usuario: string; streak: number } | null; nombreGrupo: string }) {
  const sectionLbl = 'hsl(var(--quest-text-secondary))'
  const accentClr = 'hsl(var(--primary))'

  // Sort by streak desc for ranking
  const ranked = [...communityData].sort((a, b) => (b.streak || 0) - (a.streak || 0))

  const completedToday = communityData.filter(
    u => u.progresoHoy?.lectura_completada && u.progresoHoy?.oracion_completada
  ).length

  const cardBg = 'hsl(var(--bg-surface) / 0.50)'
  const border = 'hsl(var(--border))'
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'

  return (
    <div className="flex flex-col gap-6">

      {/* Iglesia card */}
      <div
        className="rounded-[24px] p-5"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-[18px] font-bold" style={{ color: textClr }}>
            {nombreGrupo}
          </h2>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
          >
            <CheckCircle2 className="size-3.5" style={{ color: accentClr }} />
            <span className="text-[12px] font-[600] font-sans" style={{ color: accentClr }}>
              {completedToday}/{communityData.length} hoy
            </span>
          </div>
        </div>
        <p className="text-[13px] font-sans" style={{ color: subClr }}>
          {communityData.length} miembros · Racha grupal: {Math.min(...ranked.map(u => u.streak || 0))} días
        </p>
      </div>

      {/* Highest streak card */}
      {highestStreak && (
        <div
          className="rounded-[20px] p-4 flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(255,107,53,0.07)',
            border: '1px solid rgba(255,107,53,0.12)',
          }}
        >
          <div
            className="size-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,107,53,0.13)' }}
          >
            <Flame className="size-5" style={{ color: '#FF6B35' }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-sans font-medium uppercase tracking-[1px]" style={{ color: subClr }}>Racha más alta</span>
            <span className="text-[14px] font-[600] font-sans block truncate" style={{ color: textClr }}>
              {highestStreak.nombre_usuario}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[20px] font-bold font-display" style={{ color: '#FF6B35' }}>
              {highestStreak.streak}
            </span>
            <span className="text-[11px] font-sans" style={{ color: subClr }}>días</span>
          </div>
        </div>
      )}

      {/* Ranking */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-[2px] rounded-sm" style={{ backgroundColor: '#FF6B35' }} />
          <span
            className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
            style={{ color: sectionLbl }}
          >
            RANKING
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {ranked.map((user, idx) => (
            <RankRow key={user.id} user={user} rank={idx + 1} />
          ))}
        </div>
      </div>

      {/* Muro de deuda (if any) */}
      {communityData.some(u => u.deuda?.total > 0) && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-[2px] rounded-sm bg-[#FF6B6B]" />
            <span
              className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
              style={{ color: sectionLbl }}
            >
              MURO DE DEUDA
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {communityData
              .filter(u => u.deuda?.total > 0)
              .sort((a, b) => b.deuda.total - a.deuda.total)
              .map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-[20px] p-4"
                  style={{
                    backgroundColor: 'rgba(255,107,107,0.07)',
                    border: '1px solid rgba(255,107,107,0.12)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="size-4 shrink-0" style={{ color: '#FF6B6B' }} />
                    <span className="text-[14px] font-[500] font-sans text-foreground">
                      {user.nombre_usuario}
                    </span>
                  </div>
                  <span className="text-[14px] font-bold font-sans" style={{ color: '#FF6B6B' }}>
                    ${user.deuda.total.toFixed(2)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
