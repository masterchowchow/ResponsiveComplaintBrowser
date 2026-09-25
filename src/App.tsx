import { useState, useRef, useEffect } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────

const ISSUES = ['Breakdown', 'Crowded', 'Delay', 'Others'] as const

const ALL_STATIONS: { name: string; line: string; badge: string }[] = [
  ...(['Gombak','Taman Melati','Wangsa Maju','Sri Rampai','Setiawangsa','Jelatek',"Dato' Keramat",'Damai','Ampang Park','KLCC','Kampung Baru','Dang Wangi','Masjid Jamek','Pasar Seni','KL Sentral','Bangsar','Abdullah Hukum','Kerinchi','Universiti','Taman Jaya','Asia Jaya','Taman Paramount','Taman Bahagia','Kelana Jaya','Lembah Subang','Ara Damansara','Glenmarie','Subang Jaya','SS15','SS18','USJ7','Taipan','Wawasan','USJ21','Alam Megah','Subang Alam','Putra Heights']
    .map(name => ({ name, line: 'LRT · Kelana Jaya Line', badge: 'LRT' }))),
  ...(['Sentul Timur','Sentul','Titiwangsa','PWTC','Sultan Ismail','Bandar Negara','Chan Sow Lin','Cheras','Salak Selatan','Bandar Tun Razak','Sri Petaling','Bukit Jalil','Sungai Besi']
    .map(name => ({ name, line: 'LRT · Ampang & Sri Petaling Lines', badge: 'LRT' }))),
  ...(['Kwasa Damansara','Kwasa Sentral','Kota Damansara','Surian','Mutiara Damansara','Bandar Utama','TTDI','Phileo Damansara','Pusat Bandar Damansara','Semantan','Muzium Negara','Merdeka','Bukit Bintang','Tun Razak Exchange (TRX)','Cochrane','Maluri','Taman Pertama','Taman Midah','Taman Connaught','Taman Mutiara','Taman Suntex','Sri Raya','Bandar Tun Hussein Onn','Batu 11 Cheras','Bukit Dukung','Sungai Jernih','Stadium Kajang','Kajang']
    .map(name => ({ name, line: 'MRT · Kajang Line', badge: 'MRT' }))),
  ...(['Kwasa Damansara','Kampung Selamat','Sungai Buloh','Damansara Damai','Sri Delima','Kampung Batu','Kentonmen','Jalan Ipoh','Jinjang','Kepong Baru','Metro Prima','Kepong Sentral','Sri Damansara Timur','Sri Damansara Barat','Hospital Kuala Lumpur (HKL)','Titiwangsa','Raja Uda','Persiaran KLCC','Ampang Park','Tun Razak Exchange (TRX)','Chan Sow Lin','Kuchai','Salak Selatan','Bandar Malaysia','Sungai Besi','Universiti Putra Malaysia (UPM)','Putrajaya Sentral']
    .map(name => ({ name, line: 'MRT · Putrajaya Line', badge: 'MRT' }))),
  ...(['KL Sentral','Tun Sambanthan','Maharajalela','Hang Tuah','Imbi','Bukit Bintang','Raja Chulan','Bukit Nanas','Medan Tuanku','Chow Kit','Titiwangsa']
    .map(name => ({ name, line: 'KL Monorail', badge: 'Mono' }))),
]

const BADGE_COLORS: Record<string, string> = {
  LRT:  '#008bc4',
  MRT:  '#008a4b',
  Mono: '#e85d04',
}

// Bar heights (px) per 30-min slot, 6AM–12AM (36 slots)
const BAR_DATA = [
  // 6AM–8AM: low morning
  22, 24, 26, 28,
  // 8AM–10AM: morning rush
  40, 52, 68, 68,
  // 10AM–12PM: mid-morning dip
  50, 42, 42, 38,
  // 12PM–2PM: lunch rush
  42, 42, 34, 34,
  // 2PM–4PM: afternoon lull
  34, 34, 42, 42,
  // 4PM–6PM: afternoon
  42, 22, 42, 42,
  // 6PM–8PM: evening peak
  42, 42, 42, 42,
  // 8PM–10PM: tapering
  56, 56, 42, 42,
  // 10PM–12AM: late night
  30, 20, 18, 14,
]

// Time label every 2 hours (every 4 bars): 6AM…12AM
const TIME_LABELS = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM','12AM']

const BAR_W   = 14   // px bar width
const BAR_GAP = 2    // px gap between bars
const BAR_SLOT = BAR_W + BAR_GAP  // 16px per bar

// ── Assets ───────────────────────────────────────────────────────────────────

const A = '/assets'
const imgCloudRMask  = `${A}/dca1f.svg`
const imgCloudRFill  = `${A}/c0cba.svg`
const imgCloudLMask  = `${A}/ebfc8.svg`
const imgCloudLFill  = `${A}/b9c78.svg`
const imgTrackStrip  = `${A}/0d837.svg`
const imgPillarBody  = `${A}/aba8f.svg`
const imgPillarCap   = `${A}/18424.svg`
const imgBubble      = `${A}/017f3.svg`
const imgChevron     = `${A}/f98e3.svg`
const imgSearchIcon  = `${A}/2736a.svg`

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'station' | 'issue' | 'done'
type Station = typeof ALL_STATIONS[number]

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase]       = useState<Phase>('station')
  const [visPhase, setVisPhase] = useState<Phase>('station')
  const [station, setStation]   = useState<Station | null>(null)
  const [issue, setIssue]       = useState('')
  const [panelIn, setPanelIn]   = useState(true)
  const [bubbleIn, setBubbleIn] = useState(false)

  const bubbleText =
    phase === 'issue' ? `${station?.name}...` :
    phase === 'done'  ? `${station?.name}... ${issue}` : ''

  const dotStep = phase === 'station' ? 0 : 1

  const fade = (next: Phase, showBubble = true) => {
    setPanelIn(false)
    setTimeout(() => {
      setVisPhase(next); setPhase(next)
      if (showBubble) setBubbleIn(true)
      setPanelIn(true)
    }, 260)
  }

  const selectStation = (s: Station) => { setStation(s); fade('issue') }
  const selectIssue   = (i: string)  => { setIssue(i);   fade('done') }

  const reset = () => {
    setPanelIn(false); setBubbleIn(false)
    setTimeout(() => {
      setPhase('station'); setVisPhase('station')
      setStation(null); setIssue('')
      setPanelIn(true)
    }, 260)
  }

  const panelStyle: React.CSSProperties = {
    transition: 'opacity 0.26s ease, transform 0.26s ease',
    opacity: panelIn ? 1 : 0,
    transform: panelIn ? 'translateY(0)' : 'translateY(8px)',
  }
  const bubbleStyle: React.CSSProperties = {
    transition: 'opacity 0.35s ease, transform 0.35s ease',
    opacity: bubbleIn ? 1 : 0,
    transform: bubbleIn ? 'scale(1)' : 'scale(0.8)',
    transformOrigin: 'bottom left',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
      <div className="relative overflow-hidden bg-[#c2f4ff]"
        style={{ width: 390, height: 844, fontFamily: 'Helvetica, Arial, sans-serif' }}>

        {/* Clouds */}
        <Cloud mask={imgCloudRMask} fill={imgCloudRFill} style={{ left: 170, top: 127, width: 250, height: 115.641 }} />
        <Cloud mask={imgCloudLMask} fill={imgCloudLFill} style={{ left: -40, top: 236, width: 220, height: 101.766 }} />

        {/* Step dots — screen 1: first active only; screen 2: both active */}
        {phase !== 'done' && (
          <div className="absolute left-0 right-0 flex justify-center gap-2" style={{ top: 48 }}>
            <div className="rounded-full transition-all duration-300"
              style={{ width: 24, height: 8, background: '#1e40af' }} />
            <div className="rounded-full transition-all duration-300"
              style={{ width: phase === 'issue' ? 24 : 8, height: 8, background: phase === 'issue' ? '#1e40af' : '#a0c4d8' }} />
          </div>
        )}

        {/* ── FORM PANEL ── station: top 145px; issue: top 78px */}
        {phase !== 'done' && (
          <div className="absolute left-0 right-0 flex flex-col items-center"
            style={{ top: visPhase === 'station' ? 145 : 78, ...panelStyle }}>
            {visPhase === 'station' && <StationSearch onSelect={selectStation} />}
            {visPhase === 'issue'   && (
              <IssuePanel
                station={station!}
                onSelect={selectIssue}
                onBack={() => { setStation(null); fade('station', false) }}
              />
            )}
          </div>
        )}

        {/* ── COMPLAINTS CHART — only on issue screen ── */}
        {phase === 'issue' && <ComplaintsChart visible />}

        {/* ── SUCCESS — top:100px px:32px, no dots ── */}
        {phase === 'done' && (
          <div className="absolute left-0 right-0 flex flex-col items-center"
            style={{ top: 100.14, paddingLeft: 32, paddingRight: 32, ...panelStyle }}>
            <p style={{ fontWeight: 700, fontSize: 20, color: '#111', lineHeight: '30px', paddingBottom: 10, textAlign: 'center' }}>
              Complaint Submitted!
            </p>
            <div style={{ paddingBottom: 24, width: '100%' }}>
              <div className="bg-white flex flex-col"
                style={{ border: '1px solid #d7d7d7', borderRadius: 16, padding: '12px 20px', width: 326 }}>
                <SuccessRow label="Train"   value={station?.line ?? ''} divider />
                <SuccessRow label="Station" value={station?.name ?? ''} divider />
                <SuccessRow label="Issue"   value={issue} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#666', lineHeight: '18px', paddingBottom: 20, textAlign: 'center' }}>
              Thank you for helping improve RapidKL service.
            </p>
            <button className="flex items-center justify-center"
              style={{ background: '#1e40af', borderRadius: 16, width: 200, height: 44, fontWeight: 700, fontSize: 14, color: 'white' }}
              onClick={reset}>
              Submit Another
            </button>
          </div>
        )}

        {/* ── TRAIN + PLATFORM ── */}
        <div className="absolute left-0 right-0" style={{ top: 399 }}>
          {/* Gradient backdrop — only after station selected */}
          {phase !== 'station' && (
            <div className="absolute pointer-events-none"
              style={{ left: -1, top: -134, width: 392, height: 290,
                background: 'linear-gradient(to bottom, rgba(217,217,217,0), #ad0000)' }} />
          )}

          <div className="flex justify-center" style={{ position: 'relative' }}>
            <div className="overflow-hidden bg-white"
              style={{ width: 357, height: 156, borderRadius: 21, position: 'relative' }}>
              <div className="absolute top-0 left-0 right-0" style={{ height: 26, background: '#f01a23' }} />
              <div className="absolute left-0 right-0" style={{ top: 26, height: 11, background: '#292c31' }} />
              {[0,1,2].map(i => (
                <div key={i} className="absolute" style={{ background: '#9dd9e6', borderRadius: 4, width: 103, height: 65, left: 14 + i * 113, top: 42 }} />
              ))}
              <div className="absolute left-0 right-0" style={{ top: 116, height: 15, background: '#384170' }} />
              <div className="absolute left-0 right-0 bottom-0" style={{ height: 26, background: '#272622' }} />
            </div>
          </div>

          <div className="relative" style={{ height: 291 }}>
            <img src={imgTrackStrip} alt="" className="absolute" style={{ left: 0, top: 0, width: 390, height: 69.828 }} />
            <div className="absolute" style={{ left: 136.5, top: 69.83, width: 117, height: 220.703 }}>
              <img src={imgPillarCap}  alt="" className="absolute" style={{ left: 0,     top: 0,     width: 117,    height: 48.172  }} />
              <img src={imgPillarBody} alt="" className="absolute" style={{ left: 15.59, top: 46.56, width: 85.797, height: 174.141 }} />
            </div>
            {/* Speech bubble — left:19.5px top:-59px, rotated 180° with text counter-rotated */}
            <div className="absolute" style={{ left: 19.5, top: -59, width: 176, height: 140, ...bubbleStyle }}>
              <div style={{ transform: 'rotate(180deg)', width: 176, height: 140, position: 'relative' }}>
                <img src={imgBubble} alt="" style={{ width: 176, height: 140, display: 'block' }} />
                <div style={{ position: 'absolute', top: 64.09, left: 24, width: 130, transform: 'rotate(180deg)', fontWeight: 700, fontSize: 13, color: '#111', lineHeight: '18.2px' }}>
                  {bubbleText}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Complaints Chart ──────────────────────────────────────────────────────────

function ComplaintsChart({ visible }: { visible: boolean }) {
  const totalWidth = BAR_DATA.length * BAR_SLOT  // 36 × 16 = 576px
  const CHART_H = 80  // max bar height area
  const LABEL_H = 24

  return (
    <div className="absolute left-0 right-0" style={{ top: 270 }}>
      {/* Section label */}
      <p style={{ position: 'absolute', top: 0, left: 31, fontSize: 11, fontWeight: 700, color: '#000', lineHeight: '24px', zIndex: 2 }}>
        Complains
      </p>

      {/* Scrollable wrapper */}
      <style>{`.complaints-scroll::-webkit-scrollbar{display:none}`}</style>
      <div
        className="complaints-scroll"
        style={{
          marginTop: 24,
          overflowX: 'auto',
          overflowY: 'visible',
          paddingLeft: 31,
          paddingRight: 31,
          opacity: visible ? 1 : 0.35,
          transition: 'opacity 0.3s ease',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ width: totalWidth, position: 'relative' }}>

            {/* Time label row */}
            <div style={{ display: 'flex', alignItems: 'center', height: LABEL_H, marginBottom: 2 }}>
              {TIME_LABELS.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#000', lineHeight: '24px', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                  {i < TIME_LABELS.length - 1 && (
                    <>
                      {/* dot separator */}
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#333', margin: '0 8px', flexShrink: 0 }} />
                      {/* spacer to next label (4 bars minus label/dot widths) */}
                      <div style={{ width: Math.max(0, 4 * BAR_SLOT - label.length * 6.5 - 19) }} />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: BAR_GAP, height: CHART_H }}>
              {BAR_DATA.map((h, i) => (
                <div key={i} style={{
                  width: BAR_W,
                  height: h,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: 'linear-gradient(to bottom, #cb0009 62%, #dc4f4b 76%, #ffefd1 100%)',
                  opacity: h < 30 ? 0.3 : 1,
                }} />
              ))}
            </div>

          </div>
      </div>
    </div>
  )
}

// ── Station search ────────────────────────────────────────────────────────────

function StationSearch({ onSelect }: { onSelect: (s: Station) => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const seen = new Set<string>()
  const results = (query.trim().length > 0
    ? ALL_STATIONS.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.line.toLowerCase().includes(query.toLowerCase()))
    : []
  ).filter(s => { const k = `${s.name}|${s.line}`; if (seen.has(k)) return false; seen.add(k); return true })

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <>
      <p className="mb-3" style={{ fontWeight: 700, fontSize: 16, color: '#000' }}>Which station are you at?</p>
      <div className="relative" style={{ width: 317 }}>
        <div className="bg-white border border-[#d7d7d7] rounded-2xl flex items-center gap-3 px-4 transition-all focus-within:border-[#1e40af]"
          style={{ height: 60 }}>
          <img src={imgSearchIcon} alt="" className="shrink-0" style={{ width: 18, height: 18 }} />
          <input ref={inputRef}
            className="flex-1 outline-none bg-transparent"
            style={{ fontWeight: 700, fontSize: 15, color: '#000' }}
            placeholder="Search station..."
            value={query} onChange={e => setQuery(e.target.value)} />
          {query && (
            <button onClick={() => setQuery('')} className="shrink-0 text-[#aaa] hover:text-[#555]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div className="absolute left-0 right-0 bg-white border border-[#d7d7d7] rounded-2xl overflow-hidden z-20 shadow-lg"
            style={{ top: 66, maxHeight: 240, overflowY: 'auto' }}>
            {results.map((s, idx) => (
              <button key={`${s.name}|${s.line}|${idx}`}
                className="w-full text-left px-4 py-3 hover:bg-[#e8f8ff] border-b border-[#f0f0f0] last:border-0 transition-colors flex items-center gap-3"
                onClick={() => onSelect(s)}>
                <span className="rounded shrink-0 flex items-center justify-center text-white"
                  style={{ background: BADGE_COLORS[s.badge], fontSize: 10, fontWeight: 700, padding: '2px 5px', minWidth: 34 }}>
                  {s.badge}
                </span>
                <div className="flex-1 min-w-0">
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{s.line}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {query.trim().length > 0 && results.length === 0 && (
          <div className="absolute left-0 right-0 bg-white border border-[#d7d7d7] rounded-2xl z-20 shadow-lg" style={{ top: 66 }}>
            <p className="px-5 py-4 text-sm" style={{ color: '#aaa', fontWeight: 600 }}>No stations found</p>
          </div>
        )}
      </div>
      <p className="mt-3" style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
        Start typing to find your station
      </p>
    </>
  )
}

// ── Issue panel ───────────────────────────────────────────────────────────────

function IssuePanel({ station, onSelect, onBack }: {
  station: Station; onSelect: (i: string) => void; onBack: () => void
}) {
  return (
    <>
      {/* Station chip */}
      <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-white rounded-full border border-[#d7d7d7]">
        <span className="rounded flex items-center justify-center text-white"
          style={{ background: BADGE_COLORS[station.badge], fontSize: 10, fontWeight: 700, padding: '2px 5px' }}>
          {station.badge}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{station.name}</span>
        <button onClick={onBack} className="ml-1 text-[#aaa] hover:text-[#555]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="mb-3" style={{ fontWeight: 700, fontSize: 16, color: '#000' }}>What's the issue?</p>

      {/* 2 × 2 grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {[ISSUES.slice(0, 2), ISSUES.slice(2, 4)].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 8 }}>
            {row.map(iss => (
              <button key={iss}
                className="bg-white border border-[#d7d7d7] flex items-center gap-2 hover:border-[#1e40af] hover:shadow-md transition-all"
                style={{ height: 40, paddingLeft: 20, paddingRight: 20, borderRadius: 16, fontWeight: 700, fontSize: 14, color: '#000' }}
                onClick={() => onSelect(iss)}>
                {iss}
                <img src={imgChevron} alt="" style={{ width: 16, height: 16 }} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Cloud({ mask, fill, style }: { mask: string; fill: string; style: React.CSSProperties }) {
  return (
    <div className="absolute overflow-hidden pointer-events-none" style={style}>
      <div className="absolute inset-0" style={{
        maskImage: `url("${mask}")`,
        maskSize: `${style.width}px ${style.height}px`,
        maskRepeat: 'no-repeat',
      }}>
        <img src={fill} alt="" className="absolute inset-0 w-full h-full" style={{ maxWidth: 'none' }} />
      </div>
    </div>
  )
}

function SuccessRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className="flex items-start justify-between"
      style={{ minHeight: divider ? 38 : 37, paddingTop: 8, paddingBottom: 8, borderBottom: divider ? '1px solid #f0f0f0' : undefined }}>
      <p style={{ fontSize: 13, color: '#888', fontWeight: 700, lineHeight: '19.5px' }}>{label}</p>
      <p style={{ fontSize: 14, color: '#111', fontWeight: 700, lineHeight: '21px', textAlign: 'right', maxWidth: 200 }}>{value}</p>
    </div>
  )
}
