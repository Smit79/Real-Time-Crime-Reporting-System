import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  crimeType: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(10),
  severity: z.coerce.number().min(1).max(5),
});

const CrimeForm = ({ defaultValues, onSubmit, submitText = 'Save report' }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      crimeType: 'theft',
      title: '',
      description: '',
      severity: 3,
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <select className="input-field" {...register('crimeType')} aria-label="Crime type">
        {['theft', 'robbery', 'assault', 'murder', 'kidnapping', 'vandalism', 'fraud', 'harassment', 'drug_related', 'accident', 'fire', 'other'].map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input className="input-field" placeholder="Title" {...register('title')} aria-label="Report title" />
      {errors.title ? <p className="error-text">{errors.title.message}</p> : null}

      <textarea className="input-field" rows={4} placeholder="Description" {...register('description')} aria-label="Report description" />
      {errors.description ? <p className="error-text">{errors.description.message}</p> : null}

      <input type="number" min="1" max="5" className="input-field" {...register('severity')} aria-label="Severity" />

      <button type="submit" className="btn-primary" disabled={isSubmitting} aria-label={submitText}>
        {isSubmitting ? 'Saving...' : submitText}
      </button>
    </form>
  );
};

export default CrimeForm;
