export async function uploadImage(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'gadgetme_uploads');
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image: ${error}`);
  }

  const data = await response.json();
  return data.secure_url;
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', process.env.CLOUDINARY_API_KEY!);
    formData.append('timestamp', String(Date.now()));
    
    // Generate signature if needed (for signed uploads)
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

