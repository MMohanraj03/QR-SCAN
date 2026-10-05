/**
 * Generate and trigger download of RFC-compliant vCard (.vcf)
 * allows recruiters/scanners to save candidate contact directly to smartphone
 */
export function downloadCandidateVCard(candidate) {
  if (!candidate) return;

  const names = (candidate.fullName || 'Candidate').split(' ');
  const lastName = names.length > 1 ? names.pop() : '';
  const firstName = names.join(' ');

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${candidate.fullName || 'Candidate'}`,
    candidate.headline ? `TITLE:${candidate.headline}` : '',
    candidate.email ? `EMAIL;TYPE=INTERNET,WORK:${candidate.email}` : '',
    candidate.phone ? `TEL;TYPE=CELL,VOICE:${candidate.phone}` : '',
    candidate.location ? `ADR;TYPE=WORK:;;${candidate.location};;;;` : '',
    candidate.website ? `URL;TYPE=Portfolio:${candidate.website}` : '',
    candidate.linkedin ? `URL;TYPE=LinkedIn:${candidate.linkedin}` : '',
    candidate.summary ? `NOTE:${candidate.summary.replace(/\n/g, '\\n')}` : '',
    'END:VCARD'
  ].filter(line => line.length > 0);

  const vcardString = vcardLines.join('\r\n');
  const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const cleanName = (candidate.fullName || 'candidate').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
