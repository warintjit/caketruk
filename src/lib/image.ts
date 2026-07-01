/**
 * ย่อ + บีบอัดรูปในเบราว์เซอร์ก่อนอัปโหลด
 * - ย่อความกว้างสูงสุด maxWidth (คงสัดส่วนเดิม, ไม่ขยายรูปเล็ก)
 * - รูปถ่าย → JPEG quality 0.82 · PNG (กราฟิก/โปร่งใส) → คง PNG
 * - ถ้าบีบแล้วไม่เล็กลง หรือเป็น gif/svg → ใช้ไฟล์เดิม
 */
export async function compressImage(
  file: File,
  maxWidth = 1080,
  quality = 0.82,
): Promise<File> {
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml'
  ) {
    return file
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'))
    el.src = dataUrl
  })

  const scale = Math.min(1, maxWidth / img.width)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  const isPng = file.type === 'image/png'
  const outType = isPng ? 'image/png' : 'image/jpeg'
  if (!isPng) {
    // เติมพื้นขาว (JPEG ไม่มีความโปร่งใส)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outType, quality),
  )
  if (!blob || blob.size >= file.size) return file // ไม่ได้เล็กลง → ใช้ต้นฉบับ

  const ext = isPng ? 'png' : 'jpg'
  const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([blob], name, { type: outType })
}
