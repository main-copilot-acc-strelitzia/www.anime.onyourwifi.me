export const dynamic = 'force-dynamic';

import AdminLayout from '@/components/admin/AdminLayout';
import React from 'react';

export default function AuditPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/admin/audit', { credentials: 'include' }).then((r) => r.json()).then((j) => setLogs(j.data || []));
  }, []);
  return (
    <AdminLayout>
      <h1 className="text-2xl">Audit Logs</h1>
      <ul>
        {logs.map((l) => <li key={l.id}>{l.action} by {l.actorId} at {l.createdAt}</li>)}
      </ul>
    </AdminLayout>
  );
}