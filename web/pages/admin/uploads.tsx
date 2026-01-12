export const dynamic = 'force-dynamic';

import AdminLayout from '@/components/admin/AdminLayout';

export default function UploadsPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl">Uploads</h1>
      <p>Active uploads and per-uploader rate go here.</p>
    </AdminLayout>
  );
}