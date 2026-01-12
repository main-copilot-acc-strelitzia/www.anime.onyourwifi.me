export const dynamic = 'force-dynamic';

import AdminLayout from '@/components/admin/AdminLayout';
import React from 'react';

export default function TranscodesPage() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/transcoding/jobs', { credentials: 'include' }).then((r) => r.json()).then((j) => setJobs(j.data || []));
  }, []);
  return (
    <AdminLayout>
      <h1 className="text-2xl">Transcoding Jobs</h1>
      <ul>
        {jobs.map((j) => <li key={j.id}>{j.id} — {j.status}</li>)}
      </ul>
    </AdminLayout>
  );
}