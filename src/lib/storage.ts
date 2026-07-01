import { supabase } from './supabase'

const BUCKET = 'images'

/** อัปโหลดรูปเข้า bucket "images" → คืน public URL (เขียนได้เฉพาะ developer/super_admin ตาม RLS) */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
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
