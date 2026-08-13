export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0B1728] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Logo-like top section */}
        <div className="flex flex-col items-center gap-1 mb-2">
          <span className="font-extrabold text-xl tracking-widest text-white">SKYTECH</span>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">Systems SPMS — Loading</span>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400"
              style={{
                animation: `skytechPulse 1.4s ease-in-out ${i * 0.18}s infinite`
              }}
            />
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase mt-2">
          Initialising dashboard...
        </p>
      </div>

      <style>{`
        @keyframes skytechPulse {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; background-color: rgb(96 165 250); }
          40% { transform: scale(1.2); opacity: 1; background-color: rgb(59 130 246); }
        }
      `}</style>
    </div>
  );
}
