/**
 * Triggers direct browser download in Chrome and all modern browsers.
 */
export function triggerFileDownload(filename: string, content: string | Blob, mimeType: string = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadContactsCsv(contacts: any[], filename: string = 'wishora_birthday_contacts.csv') {
  const headers = ['Name', 'Birth Date', 'Birth Month', 'Birth Day', 'Birth Year', 'Gender', 'Relationship', 'Phone', 'Email', 'Note'];
  const rows = contacts.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${c.dob_year ? `${c.dob_year}-${String(c.dob_month).padStart(2, '0')}-${String(c.dob_day || 1).padStart(2, '0')}` : `${String(c.dob_month).padStart(2, '0')}-${String(c.dob_day || 1).padStart(2, '0')}`}"`,
    c.dob_month || 1,
    c.dob_day || 1,
    c.dob_year || '',
    `"${c.gender || 'unspecified'}"`,
    `"${c.relationship || 'Friend'}"`,
    `"${c.phone || ''}"`,
    `"${c.email || ''}"`,
    `"${(c.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  triggerFileDownload(filename, csvContent, 'text/csv;charset=utf-8;');
}

export function downloadWishKeepsake(wish: any) {
  const jsonContent = JSON.stringify(wish, null, 2);
  triggerFileDownload(`Wishora_Keepsake_${wish.slug || 'wish'}.json`, jsonContent, 'application/json');
}
