/**
 * โลโก้แบรนด์ "เค้กที่รัก" — หัวใจลายเส้นมือสีแดง (echo โลโก้จริง)
 * ใช้ชั่วคราวจนกว่าจะวางไฟล์ /logo.png ลง public/
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 60"
      className={className}
      role="img"
      aria-label="เค้กที่รัก CAKE'TEERUK"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 54C20 44 6 35 6 21.5 6 13 12.5 7 20 7c5.4 0 9.8 3 12 7.5C34.2 10 38.6 7 44 7c7.5 0 14 6 14 14.5C58 35 44 44 32 54Z"
        stroke="var(--color-cake-600)"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
