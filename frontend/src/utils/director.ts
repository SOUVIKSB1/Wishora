/**
 * Generates a unique, elegant Director Identifier for any user.
 * Format: #DIR-8X29K1 or #DIR-MASTER-01
 */
export function getDirectorId(user: any): string {
  if (!user) return '#DIR-GUEST';
  if (user.role === 'admin' || user.email?.toLowerCase().includes('admin')) {
    return '#DIR-MASTER-01';
  }
  if (user.id) {
    const clean = user.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const sub = clean.startsWith('USR') ? clean.slice(3) : clean;
    const token = sub.slice(-6).padEnd(6, '9');
    return `#DIR-${token}`;
  }
  if (user.email) {
    let hash = 0;
    for (let i = 0; i < user.email.length; i++) {
      hash = (hash << 5) - hash + user.email.charCodeAt(i);
      hash |= 0;
    }
    const token = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
    return `#DIR-${token}`;
  }
  return '#DIR-88219';
}
