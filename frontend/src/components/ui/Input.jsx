export default function Input({ label, error, prefix, suffix, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-slate-500 text-base font-medium">{prefix}</span>}
        <input
          className={`w-full border rounded-xl px-4 py-3 text-base bg-white outline-none transition-all
            focus:border-brand-700 focus:ring-2 focus:ring-brand-100
            ${error ? 'border-red-400' : 'border-slate-200'}
            ${prefix ? 'pl-10' : ''}
            ${suffix ? 'pr-10' : ''}
            ${className}`}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-slate-500">{suffix}</span>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
