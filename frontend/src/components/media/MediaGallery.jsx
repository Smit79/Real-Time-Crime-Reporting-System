import { formatFileSize } from '../../utils/formatters';

const MediaGallery = ({ mediaFiles = [] }) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {mediaFiles.map((item) => (
        <article key={item._id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          {item.fileType === 'image' ? (
            <img src={item.url} alt={item.originalName || 'Uploaded media'} className="h-44 w-full object-cover" />
          ) : (
            <div className="grid h-44 place-items-center bg-slate-100 text-sm text-text-muted dark:bg-slate-800">
              {item.fileType.toUpperCase()} FILE
            </div>
          )}
          <div className="p-3">
            <p className="truncate text-sm font-medium text-text">{item.originalName}</p>
            <p className="text-xs text-text-muted">{formatFileSize(item.sizeBytes || 0)}</p>
          </div>
        </article>
      ))}
    </div>
  );
};

export default MediaGallery;
