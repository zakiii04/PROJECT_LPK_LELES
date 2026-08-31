'use client';

import { useMemo } from 'react';
import type { PendaftarFormData } from '@/lib/storage';

interface Step2Props {
  data: PendaftarFormData;
  onChange: (field: keyof PendaftarFormData, value: string) => void;
  errors: Record<string, string>;
}

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Kurus', className: 'bmi-underweight', emoji: '', color: '#2563eb' };
  if (bmi < 25) return { label: 'Normal', className: 'bmi-normal', emoji: '', color: '#16a34a' };
  if (bmi < 30) return { label: 'Berlebih', className: 'bmi-overweight', emoji: '', color: '#ca8a04' };
  return { label: 'Obesitas', className: 'bmi-obese', emoji: '', color: '#dc2626' };
}

function getBmiNeedleAngle(bmi: number) {
  // Map BMI 15-40 to -90deg to 90deg
  const clampedBmi = Math.max(15, Math.min(40, bmi));
  return ((clampedBmi - 15) / 25) * 180 - 90;
}

export default function Step2DataFisik({ data, onChange, errors }: Step2Props) {
  const bmiData = useMemo(() => {
    if (!data.tinggi_badan || !data.berat_badan) return null;
    const height = Number(data.tinggi_badan);
    const weight = Number(data.berat_badan);
    if (height <= 0 || weight <= 0) return null;
    const bmi = weight / Math.pow(height / 100, 2);
    const category = getBmiCategory(bmi);
    const angle = getBmiNeedleAngle(bmi);
    return { value: bmi, ...category, angle };
  }, [data.tinggi_badan, data.berat_badan]);

  return (
    <div className="animate-slide-right">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Data Fisik</h2>
          <p className="text-[var(--text-tertiary)] text-xs">Masukkan informasi fisik Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        {/* Tinggi Badan */}
        <div className="form-group">
          <label className="form-label" htmlFor="tinggi_badan">
            Tinggi Badan <span className="required">*</span>
          </label>
          <div className="relative">
            <input
              id="tinggi_badan"
              type="number"
              className={`form-input ${errors.tinggi_badan ? 'error' : ''}`}
              placeholder="Contoh: 170"
              min={100}
              max={250}
              value={data.tinggi_badan}
              onChange={(e) => onChange('tinggi_badan', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-xs font-semibold bg-[var(--surface)] px-2 py-1 rounded-md">
              cm
            </span>
          </div>
          {errors.tinggi_badan && (
            <span className="form-error">{errors.tinggi_badan}</span>
          )}
        </div>

        {/* Berat Badan */}
        <div className="form-group">
          <label className="form-label" htmlFor="berat_badan">
            Berat Badan <span className="required">*</span>
          </label>
          <div className="relative">
            <input
              id="berat_badan"
              type="number"
              className={`form-input ${errors.berat_badan ? 'error' : ''}`}
              placeholder="Contoh: 65"
              min={30}
              max={200}
              value={data.berat_badan}
              onChange={(e) => onChange('berat_badan', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-xs font-semibold bg-[var(--surface)] px-2 py-1 rounded-md">
              kg
            </span>
          </div>
          {errors.berat_badan && (
            <span className="form-error">{errors.berat_badan}</span>
          )}
        </div>

        {/* Lingkar Pinggang */}
        <div className="form-group">
          <label className="form-label" htmlFor="lingkar_pinggang">
            Lingkar Pinggang <span className="required">*</span>
          </label>
          <div className="relative">
            <input
              id="lingkar_pinggang"
              type="number"
              className={`form-input ${errors.lingkar_pinggang ? 'error' : ''}`}
              placeholder="Contoh: 78"
              min={30}
              max={200}
              value={data.lingkar_pinggang}
              onChange={(e) => onChange('lingkar_pinggang', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-xs font-semibold bg-[var(--surface)] px-2 py-1 rounded-md">
              cm
            </span>
          </div>
          {errors.lingkar_pinggang && (
            <span className="form-error">{errors.lingkar_pinggang}</span>
          )}
        </div>
      </div>

      {/* Enhanced BMI Calculator */}
      {bmiData && (
        <div className="bmi-card mt-6">
          <div className="bmi-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Kalkulator BMI
                </span>
              </div>
              <span className={`bmi-category ${bmiData.className}`}>
                {bmiData.emoji} {bmiData.label}
              </span>
            </div>
          </div>
          <div className="bmi-body">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Gauge */}
              <div className="flex-shrink-0">
                <div className="bmi-gauge">
                  <div className="bmi-gauge-bg">
                    <div className="bmi-gauge-inner" />
                  </div>
                  <div
                    className="bmi-needle"
                    style={{ transform: `rotate(${bmiData.angle}deg)` }}
                  />
                </div>
                <div className="flex justify-between text-[0.6rem] text-[var(--text-tertiary)] px-1 -mt-1">
                  <span>15</span>
                  <span>Kurus</span>
                  <span>Normal</span>
                  <span>Gemuk</span>
                  <span>40</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 w-full">
                <div className="text-center sm:text-left mb-3">
                  <div className="text-4xl font-extrabold" style={{ color: bmiData.color }}>
                    {bmiData.value.toFixed(1)}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">kg/m²</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[var(--surface)] rounded-lg p-2.5 text-center">
                    <div className="text-xs text-[var(--text-tertiary)]">Tinggi</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {data.tinggi_badan} cm
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-lg p-2.5 text-center">
                    <div className="text-xs text-[var(--text-tertiary)]">Berat</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {data.berat_badan} kg
                    </div>
                  </div>
                  <div className="bg-[var(--surface)] rounded-lg p-2.5 text-center">
                    <div className="text-xs text-[var(--text-tertiary)]">Status</div>
                    <div className="text-sm font-bold" style={{ color: bmiData.color }}>
                      {bmiData.label}
                    </div>
                  </div>
                </div>

                {/* BMI Range Indicator */}
                <div className="mt-3 relative h-2 rounded-full overflow-hidden bg-[var(--surface-hover)]">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow-md transition-all duration-700"
                    style={{
                      borderColor: bmiData.color,
                      left: `${Math.max(2, Math.min(98, ((bmiData.value - 15) / 25) * 100))}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[0.6rem] text-[var(--text-tertiary)] mt-1">
                  <span>Kurus</span>
                  <span>Normal</span>
                  <span>Berlebih</span>
                  <span>Obesitas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
