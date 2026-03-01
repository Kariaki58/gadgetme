import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    // Support both single file (for backward compatibility) and multiple files
    const filesToUpload = singleFile ? [singleFile] : files;

    if (!filesToUpload || filesToUpload.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Limit to 5 files max
    if (filesToUpload.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'gadgetme_uploads';

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { status: 500 }
      );
    }

    // Upload all files to Cloudinary
    const uploadPromises = filesToUpload.map(async (file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${file.name} is not an image`);
      }

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      
      // Use signed upload if API credentials are available, otherwise try upload preset
      if (apiKey && apiSecret) {
        // Generate signature for signed upload
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'gadgetme/products';
        
        // Create signature string (must be sorted)
        const paramsToSign: Record<string, string> = {
          timestamp: timestamp.toString(),
          folder,
        };
        
        const signatureString = Object.keys(paramsToSign)
          .sort()
          .map(key => `${key}=${paramsToSign[key]}`)
          .join('&') + apiSecret;
        
        const crypto = await import('crypto');
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
        
        cloudinaryFormData.append('api_key', apiKey);
        cloudinaryFormData.append('timestamp', timestamp.toString());
        cloudinaryFormData.append('signature', signature);
        cloudinaryFormData.append('folder', folder);
      } else {
        // Fall back to upload preset (unsigned)
        cloudinaryFormData.append('upload_preset', uploadPreset);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudinary upload failed: ${error}`);
      }

      const data = await response.json();
      return data.secure_url;
    });

    const urls = await Promise.all(uploadPromises);

    // Return single URL for backward compatibility, or array of URLs
    if (singleFile) {
      return NextResponse.json({ url: urls[0] });
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload images' },
      { status: 500 }
    );
  }
}

