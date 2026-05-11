import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, MapPin, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import FileUploader from '../../components/media/FileUploader';
import LocationPicker from '../../components/map/LocationPicker';
import PageTransition from '../../components/common/PageTransition';
import useGeolocation from '../../hooks/useGeolocation';
import useCrimeStore from '../../store/crimeStore';
import { CRIME_TYPE_COLORS, DEFAULT_MAP_CENTER } from '../../utils/constants';

const steps = ['Crime Details', 'Location', 'Evidence', 'Review'];

const formSchema = z.object({
  crimeType: z.string().min(1, 'Crime type is required'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  contactPhone: z.string().min(7, 'Phone number is required').max(20, 'Phone number is too long'),
  contactEmail: z.string().email('Valid email is required'),
  severity: z.coerce.number().min(1).max(5),
  incidentTime: z.string().min(1, 'Incident time is required'),
  witnesses: z.coerce.number().min(0).max(100),
  isAnonymous: z.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  fullAddress: z.string().optional(),
});

const ReportCrimePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { latitude, longitude, getCurrentPosition } = useGeolocation();

  const createReport = useCrimeStore((state) => state.createReport);

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    document.title = 'Report Crime | CrimeWatch';
  }, []);

  const defaultLat = Number(searchParams.get('lat')) || DEFAULT_MAP_CENTER[0];
  const defaultLng = Number(searchParams.get('lng')) || DEFAULT_MAP_CENTER[1];

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crimeType: 'theft',
      title: '',
      description: '',
      contactPhone: '',
      contactEmail: '',
      severity: 3,
      incidentTime: new Date().toISOString().slice(0, 16),
      witnesses: 0,
      isAnonymous: false,
      lat: defaultLat,
      lng: defaultLng,
      street: '',
      city: '',
      state: '',
      pincode: '',
      fullAddress: '',
    },
    mode: 'onBlur',
  });

  const formValues = watch();

  useEffect(() => {
    if (!hasCoordinates) return;
    setValue('lat', latitude);
    setValue('lng', longitude);
  }, [hasCoordinates, latitude, longitude, setValue]);

  const selectedLocation = useMemo(
    () => [Number(formValues.lat || defaultLat), Number(formValues.lng || defaultLng)],
    [defaultLat, defaultLng, formValues.lat, formValues.lng]
  );

  const goNext = async () => {
    if (step === 1) {
      const valid = await trigger([
        'crimeType',
        'title',
        'description',
        'contactPhone',
        'contactEmail',
        'severity',
        'incidentTime',
        'witnesses',
      ]);
      if (!valid) return;
    }

    if (step === 2) {
      const valid = await trigger(['lat', 'lng']);
      if (!valid) return;
    }

    setStep((prev) => Math.min(4, prev + 1));
  };

  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  const onSubmit = async (values) => {
    const formData = new FormData();

    formData.append('crimeType', values.crimeType);
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('contactPhone', values.contactPhone);
    formData.append('contactEmail', values.contactEmail);
    formData.append('severity', String(values.severity));
    formData.append('incidentTime', new Date(values.incidentTime).toISOString());
    formData.append('witnesses', String(values.witnesses || 0));
    formData.append('isAnonymous', String(Boolean(values.isAnonymous)));
    formData.append('latitude', String(values.lat));
    formData.append('longitude', String(values.lng));
    formData.append(
      'address',
      JSON.stringify({
        street: values.street || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        pincode: values.pincode || undefined,
        full: values.fullAddress || undefined,
      })
    );

    files.forEach((file) => formData.append('media', file));

    await createReport(formData, (event) => {
      if (!event.total) return;
      setUploadProgress(Math.round((event.loaded / event.total) * 100));
    });

    setSuccessOverlay(true);
    setTimeout(() => navigate('/my-reports', { replace: true }), 1600);
  };

  return (
    <PageTransition className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-text">Report a Crime</h1>
        <p className="text-sm text-text-muted">Provide accurate details to help responders act quickly and safely.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const active = step === stepNumber;
          const done = step > stepNumber;

          return (
            <div
              key={label}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                done
                  ? 'border-success bg-success/10 text-success'
                  : active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-muted'
              }`}
            >
              Step {stepNumber}: {label}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-text">Step 1 - Crime Details</h2>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(CRIME_TYPE_COLORS).map(([crimeType, color]) => (
                <button
                  key={crimeType}
                  type="button"
                  onClick={() => setValue('crimeType', crimeType, { shouldValidate: true })}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition ${
                    formValues.crimeType === crimeType ? 'border-text text-text' : 'border-border text-text-muted'
                  }`}
                  style={{ backgroundColor: `${color}22` }}
                  aria-label={`Select crime type ${crimeType}`}
                >
                  {crimeType.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div>
              <label className="label">Title</label>
              <input className="input-field" {...register('title')} aria-label="Crime title" />
              {errors.title ? <p className="error-text">{errors.title.message}</p> : null}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea rows={4} className="input-field" {...register('description')} aria-label="Crime description" />
              {errors.description ? <p className="error-text">{errors.description.message}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Contact phone</label>
                <input className="input-field" placeholder="Enter phone number" {...register('contactPhone')} aria-label="Contact phone number" />
                {errors.contactPhone ? <p className="error-text">{errors.contactPhone.message}</p> : null}
              </div>
              <div>
                <label className="label">Contact email</label>
                <input type="email" className="input-field" placeholder="Enter email" {...register('contactEmail')} aria-label="Contact email" />
                {errors.contactEmail ? <p className="error-text">{errors.contactEmail.message}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Severity (1-5)</label>
                <input type="range" min="1" max="5" className="w-full" {...register('severity')} />
                <p className="text-xs text-text-muted">Selected severity: {formValues.severity}</p>
              </div>
              <div>
                <label className="label">Incident time</label>
                <input type="datetime-local" className="input-field" {...register('incidentTime')} aria-label="Incident time" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Witness count</label>
                <input type="number" min="0" className="input-field" {...register('witnesses')} aria-label="Witnesses" />
              </div>
              <label className="inline-flex items-center gap-2 self-end text-sm text-text-muted">
                <input type="checkbox" {...register('isAnonymous')} /> Submit anonymously
              </label>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-text">Step 2 - Location</h2>
              <button
                type="button"
                className="btn-surface inline-flex items-center gap-1"
                onClick={getCurrentPosition}
                aria-label="Use current location"
              >
                <MapPin size={14} /> Use current location
              </button>
            </div>

            <div className="h-[360px] overflow-hidden rounded-2xl border border-border">
              <MapContainer center={selectedLocation} zoom={13} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker
                  position={selectedLocation}
                  onChange={(position) => {
                    setValue('lat', Number(position[0].toFixed(6)));
                    setValue('lng', Number(position[1].toFixed(6)));
                  }}
                />
              </MapContainer>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Latitude</label>
                <input type="number" step="any" className="input-field" {...register('lat')} aria-label="Latitude" />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input type="number" step="any" className="input-field" {...register('lng')} aria-label="Longitude" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input className="input-field" placeholder="Street" {...register('street')} aria-label="Street" />
              <input className="input-field" placeholder="City" {...register('city')} aria-label="City" />
              <input className="input-field" placeholder="State" {...register('state')} aria-label="State" />
              <input className="input-field" placeholder="Pincode" {...register('pincode')} aria-label="Pincode" />
            </div>
            <textarea className="input-field" rows={2} placeholder="Full address" {...register('fullAddress')} aria-label="Full address" />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-text">Step 3 - Evidence</h2>
            <p className="text-sm text-text-muted">Add photos, videos, or audio. Maximum 5 files.</p>
            <FileUploader files={files} onFilesChange={setFiles} />
            {isSubmitting ? (
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-semibold text-text-muted">Upload progress</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="mt-1 text-xs text-text-muted">{uploadProgress}%</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-text">Step 4 - Review and Submit</h2>
            <div className="grid gap-3 rounded-xl border border-border p-4 text-sm">
              <p><span className="font-semibold text-text">Crime Type:</span> {formValues.crimeType}</p>
              <p><span className="font-semibold text-text">Title:</span> {formValues.title}</p>
              <p><span className="font-semibold text-text">Description:</span> {formValues.description}</p>
              <p><span className="font-semibold text-text">Contact Phone:</span> {formValues.contactPhone}</p>
              <p><span className="font-semibold text-text">Contact Email:</span> {formValues.contactEmail}</p>
              <p><span className="font-semibold text-text">Severity:</span> {formValues.severity}</p>
              <p><span className="font-semibold text-text">Incident Time:</span> {new Date(formValues.incidentTime).toLocaleString()}</p>
              <p><span className="font-semibold text-text">Witnesses:</span> {formValues.witnesses}</p>
              <p><span className="font-semibold text-text">Anonymous:</span> {formValues.isAnonymous ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold text-text">Coordinates:</span> {formValues.lat}, {formValues.lng}</p>
              <p><span className="font-semibold text-text">Files Attached:</span> {files.length}</p>
            </div>
            <button
              type="submit"
              className="btn-danger inline-flex items-center gap-2"
              disabled={isSubmitting}
              aria-label="Submit crime report"
            >
              <ShieldAlert size={16} /> {isSubmitting ? 'Submitting report...' : 'Submit report'}
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || isSubmitting}
            className="btn-surface inline-flex items-center gap-1"
            aria-label="Previous step"
          >
            <ChevronLeft size={14} /> Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="btn-primary inline-flex items-center gap-1"
              aria-label="Next step"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : null}
        </div>
      </form>

      <AnimatePresence>
        {successOverlay ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-success/30 bg-surface p-6 text-center shadow-soft"
            >
              <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-success/20" />
              <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-primary/20" />
              <div className="relative z-10">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="mt-3 font-heading text-2xl font-bold text-text">Report Submitted</h3>
                <p className="mt-1 text-sm text-text-muted">Thank you for helping keep your community safe.</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
};

export default ReportCrimePage;
