export default function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
    secondary: 'bg-white text-brand-700 border-2 border-brand-700 hover:bg-brand-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-brand-700 hover:bg-brand-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg w-full',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Procesando...
        </span>
      ) : children}
    </button>
  )
}
