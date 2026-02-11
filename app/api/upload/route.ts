import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, PNG allowed' }, { status: 400 });
        }

        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
        const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${sanitizedName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from('invoices')
            .upload(uniqueName, file, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        // Get signed URL (7 days expiry)
        const { data: urlData } = await supabaseAdmin.storage
            .from('invoices')
            .createSignedUrl(uniqueName, 604800);

        return NextResponse.json({
            success: true,
            fileUrl: urlData?.signedUrl,
            fileName: uniqueName,
            fileSize: file.size,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
