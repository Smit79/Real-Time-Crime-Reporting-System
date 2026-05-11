import CrimeBadge from './CrimeBadge';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '../../utils/formatters';

const CrimeDetail = ({ report }) => {
  if (!report) return null;

  const mediaList = Array.isArray(report.mediaUrls) ? report.mediaUrls : [];

  return (
    <article className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <CrimeBadge type={report.crimeType} />
        <SeverityBadge severity={report.severity} />
        <StatusBadge status={report.status} />
      </div>

      <h3 className="text-2xl font-bold text-text">{report.title}</h3>
      <p className="text-sm text-text-muted">{report.description}</p>

      <div className="grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
        <p><span className="font-semibold text-text">Reported At:</span> {report.createdAt ? formatDateTime(report.createdAt) : 'N/A'}</p>
        <p><span className="font-semibold text-text">Incident Time:</span> {report.incidentTime ? formatDateTime(report.incidentTime) : 'N/A'}</p>
        <p><span className="font-semibold text-text">Reporter:</span> {report.reportedBy?.fullName || 'Anonymous'}</p>
        <p><span className="font-semibold text-text">Witnesses:</span> {report.witnesses ?? 0}</p>
        <p><span className="font-semibold text-text">Contact Email:</span> {report.contactDetails?.email || 'Not shared'}</p>
        <p><span className="font-semibold text-text">Contact Phone:</span> {report.contactDetails?.phone || 'Not shared'}</p>
        <p className="sm:col-span-2"><span className="font-semibold text-text">Address:</span> {report.address?.full || 'N/A'}</p>
        <p className="sm:col-span-2"><span className="font-semibold text-text">Coordinates:</span> {report.location?.coordinates?.[1] ?? 'N/A'}, {report.location?.coordinates?.[0] ?? 'N/A'}</p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-text">Proof Documents / Evidence</h4>
        {mediaList.length === 0 ? (
          <p className="text-sm text-text-muted">No proof documents uploaded.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {mediaList.map((media, index) => {
              const key = `${media.url}-${index}`;
              const type = media.fileType || '';

              if (type === 'video') {
                return (
                  <video key={key} controls className="h-40 w-full rounded-xl border border-border object-cover">
                    <source src={media.url} />
                  </video>
                );
              }

              if (type === 'audio') {
                return (
                  <div key={key} className="rounded-xl border border-border p-3">
                    <audio controls className="w-full">
                      <source src={media.url} />
                    </audio>
                    <a href={media.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                      Open audio proof
                    </a>
                  </div>
                );
              }

              return (
                <a key={key} href={media.url} target="_blank" rel="noreferrer" className="block">
                  <img src={media.url} alt="Crime proof" className="h-40 w-full rounded-xl border border-border object-cover" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};

export default CrimeDetail;
