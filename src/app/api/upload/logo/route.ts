import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has a store
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const requestFormData = await request.formData();
    const file = requestFormData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'gadgetme_uploads';
    
    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME in environment variables.' },
        { status: 500 }
      );
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    
    // Use signed upload if API credentials are available (more reliable)
    if (apiKey && apiSecret) {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = 'gadgetme/logos';
      
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
      // Fall back to upload preset (unsigned) - requires preset to exist
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
      const errorText = await response.text();
      let errorMessage = 'Failed to upload image';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
          // Provide helpful message for common errors
          if (errorMessage.includes('preset not found')) {
            errorMessage = 'Upload preset not found. Please create the preset "gadgetme_uploads" in Cloudinary or set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET for signed uploads.';
          } else if (errorMessage.includes('cloud_name is disabled')) {
            errorMessage = 'Cloudinary cloud name is disabled. Please check your Cloudinary account settings.';
          }
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error('Cloudinary error:', errorText);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ url: data.secure_url });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

