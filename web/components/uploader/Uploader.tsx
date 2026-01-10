import React, { useState } from 'react';

export default function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preferDown, setPreferDown] = useState(true);
  const [keepOriginal, setKeepOriginal] = useState(false);
  const [status, setStatus] = useState('');

  async function handleUpload() {
    if (!file) return;
    setStatus('initing');
    const initRes = await fetch('/api/upload/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ filename: file.name, size: file.size, prefer_downscale_to_1080: preferDown, keep_original: keepOriginal }),
    });
    const initJson = await initRes.json();
    const presigned = initJson.data.presignedUrl;
    setStatus('uploading');
    await fetch(presigned, { method: 'PUT', body: file });
    setStatus('completing');
    const complete = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ uploadId: initJson.data.uploadId, metadata: { prefer_downscale_to_1080: preferDown, keep_original: keepOriginal } }),
    });
    const complJson = await complete.json();
    setStatus(`enqueued job ${complJson.data.jobId}`);
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div>
        <label><input type="checkbox" checked={preferDown} onChange={(e) => setPreferDown(e.target.checked)} /> Prefer downscale to 1080 (recommended)</label>
      </div>
      <div>
        <label><input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} /> Keep original file after transcode (costs space)</label>
      </div>
      <button onClick={handleUpload} disabled={!file}>Upload</button>
      <div>{status}</div>
    </div>
  );
}