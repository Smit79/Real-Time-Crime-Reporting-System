import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = ({ connected = false }) => {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:text-[11px] ${
        connected
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-danger/30 bg-danger/10 text-danger'
      }`}
      aria-live="polite"
      aria-label={connected ? 'Realtime connected' : 'Realtime disconnected'}
      title={connected ? 'Realtime connected' : 'Realtime disconnected'}
    >
      {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
    </div>
  );
};

export default ConnectionStatus;
