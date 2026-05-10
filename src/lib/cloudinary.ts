/* Cloudinary helper (client-side unsigned uploads)
   - Uses NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UNSIGNED_UPLOAD_PRESET
   - Uploads files directly from the browser (unsigned preset)
*/

export async function uploadFilesToCloudinary(files: File[], onProgress?: (completed: number, total: number) => void): Promise<string[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_UPLOAD_PRESET || "";

  if (!cloudName || !unsignedPreset) {
    throw new Error("Cloudinary configuration missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UNSIGNED_UPLOAD_PRESET.");
  }

  const uploadSingle = async (file: File) => {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", unsignedPreset);

    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed: ${text}`);
    }
    const data = await res.json();
    return data.secure_url || data.url;
  };

  const total = files.length;
  let completedCount = 0;

  const results = await Promise.all(
    files.map(async (file) => {
      const url = await uploadSingle(file);
      completedCount++;
      onProgress?.(completedCount, total);
      return url;
    })
  );

  return results;
}
