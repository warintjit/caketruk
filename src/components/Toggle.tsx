/** สวิตช์ เปิด/ปิด (on/off) ใช้ซ้ำได้ทั้งแอป */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="inline-flex items-center gap-2 disabled:opacity-50"
    >
      {label && (
        <span className={`text-sm font-medium ${checked ? 'text-cake-700' : 'text-gray-400'}`}>
          {label}
        </span>
      )}
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-cake-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}
