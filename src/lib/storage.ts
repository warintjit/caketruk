import { supabase } from './supabase'
import { compressImage } from './image'

const BUCKET = 'images'

/**
 * อัปโหลดรูปเข้า bucket "images" → คืน public URL
 * ย่อ+บีบอัดรูปอัตโนมัติก่อนอัป (เจ้าของร้านอัปจากมือถือได้เลย ไม่ต้องคิดขนาด)
 * เขียนได้เฉพาะ developer/super_admin ตาม RLS
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const optimized = await compressImage(file)
  const ext =
    optimized.type === 'image/png'
      ? 'png'
      : optimized.type === 'image/jpeg'
        ? 'jpg'
        : optimized.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimized, { upsert: false, contentType: optimized.type })
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** ลบรูปด้วย public URL (ถอด path หลัง /images/) — เงียบไว้ถ้าลบไม่สำเร็จ */
export async function deleteImage(publicUrl: string | null): Promise<void> {
  if (!publicUrl) return
  const marker = `/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
