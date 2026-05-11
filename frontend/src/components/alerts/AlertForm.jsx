import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  label: z.string().min(2, 'Label is required'),
  radiusKm: z.coerce.number().min(1).max(50),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  minSeverity: z.coerce.number().min(1).max(5),
  crimeTypes: z.array(z.string()).optional(),
  channelsPush: z.boolean().optional(),
  channelsEmail: z.boolean().optional(),
  channelsInApp: z.boolean().optional(),
});

const AlertForm = ({ onSubmit, defaultValues }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues:
      defaultValues ||
      {
        label: '',
        radiusKm: 5,
        lat: 22.9734,
        lng: 78.6569,
        minSeverity: 1,
        crimeTypes: [],
        channelsPush: true,
        channelsEmail: false,
        channelsInApp: true,
      },
  });

  const crimeOptions = [
    'theft',
    'robbery',
    'assault',
    'murder',
    'kidnapping',
    'vandalism',
    'fraud',
    'harassment',
    'drug_related',
    'accident',
    'fire',
    'other',
  ];

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit((values) =>
        onSubmit({
          label: values.label,
          radiusKm: values.radiusKm,
          longitude: values.lng,
          latitude: values.lat,
          minSeverity: values.minSeverity,
          crimeTypes: values.crimeTypes || [],
          channels: {
            push: Boolean(values.channelsPush),
            email: Boolean(values.channelsEmail),
            in_app: Boolean(values.channelsInApp),
          },
        })
      )}
    >
      <input className="input-field" placeholder="Label" {...register('label')} aria-label="Subscription label" />
      {errors.label ? <p className="error-text">{errors.label.message}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <input type="number" min="1" max="50" className="input-field" {...register('radiusKm')} aria-label="Radius in kilometers" />
        <input type="number" min="1" max="5" className="input-field" {...register('minSeverity')} aria-label="Minimum severity" />
      </div>

      <select className="input-field" multiple {...register('crimeTypes')} aria-label="Crime type filters">
        {crimeOptions.map((crimeType) => (
          <option key={crimeType} value={crimeType}>
            {crimeType.replace('_', ' ')}
          </option>
        ))}
      </select>

      <div className="grid gap-3 md:grid-cols-2">
        <input type="number" step="any" className="input-field" {...register('lat')} aria-label="Latitude" />
        <input type="number" step="any" className="input-field" {...register('lng')} aria-label="Longitude" />
      </div>

      <div className="rounded-xl border border-border p-3 text-sm text-text-muted">
        <p className="mb-2 font-semibold text-text">Notification channels</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" {...register('channelsPush')} /> Push
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" {...register('channelsEmail')} /> Email
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" {...register('channelsInApp')} /> In-app
          </label>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting} aria-label="Save alert subscription">
        {isSubmitting ? 'Saving...' : 'Save subscription'}
      </button>
    </form>
  );
};

export default AlertForm;
