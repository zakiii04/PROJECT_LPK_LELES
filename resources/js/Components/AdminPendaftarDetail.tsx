'use client';

import { getStatusLabel, getStatusBadgeClass } from '@/lib/storage';
import { pendaftarApi, pembayaranApi } from '@/lib/api';
import type { Pendaftar } from '@/lib/types';

interface AdminPendaftarDetailProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onStatusChange: () => void;
}

export default function AdminPendaftarDetail({
  pendaftar,
  onClose,
  onStatusChange,
}: AdminPendaftarDetailProps) {
  const handleAccept = async () => {
    await pendaftarApi.updateStatus(pendaftar.id, 'diterima');
    onStatusChange();
  };

  const handleReject = async () => {
    await pendaftarApi.updateStatus(pendaftar.id, 'ditolak');
    onStatusChange();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--card-border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Detail Pendaftar Peserta</h2>
            <p className="text-sm text-[var(--text-secondary)] font-mono">{pendaftar.no_pendaftaran}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] transition-colors text-[var(--text-tertiary)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Status Validasi</span>
            <span className={getStatusBadgeClass(pendaftar.status)}>{getStatusLabel(pendaftar.status)}</span>
          </div>

          <Section title="Data Diri & Akun">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Nama Lengkap" value={pendaftar.nama_lengkap} span2 />
              <InfoItem label="NIK" value={pendaftar.nik} />
              <InfoItem label="Username / Email" value={pendaftar.user?.username || pendaftar.email} />
              <InfoItem label="TTL" value={`${pendaftar.tempat_lahir}, ${pendaftar.tanggal_lahir ? new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`} />
              <InfoItem label="Jenis Kelamin" value={pendaftar.jenis_kelamin} />
            </div>
            <div className="mt-3">
              <InfoItem label="Alamat" value={pendaftar.alamat} span2 />
            </div>
          </Section>

          <Section title="Data Fisik & Kesehatan">
            <div className="grid grid-cols-3 gap-3">
              <InfoItem label="Tinggi" value={`${pendaftar.tinggi_badan} cm`} />
              <InfoItem label="Berat" value={`${pendaftar.berat_badan} kg`} />
              <InfoItem label="Lingkar Pinggang" value={pendaftar.lingkar_pinggang} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <InfoItem label="BMI" value={`${(Number(pendaftar.berat_badan) / Math.pow(Number(pendaftar.tinggi_badan) / 100, 2)).toFixed(1)} kg/m²`} />
              <InfoItem label="Riwayat Penyakit" value={pendaftar.riwayat_penyakit || 'Tidak ada'} />
            </div>
          </Section>

          <Section title="Informasi Kontak">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="No. HP" value={pendaftar.no_hp} />
              <InfoItem label="Email" value={pendaftar.email} />
              <InfoItem label="Kontak Darurat" value={pendaftar.nama_kontak_darurat} />
              <InfoItem label="No. HP Darurat" value={pendaftar.no_hp_kontak_darurat} />
            </div>
            <div className="mt-3">
              <InfoItem label="Hubungan Kontak" value={pendaftar.hubungan_kontak_darurat} span2 />
            </div>
          </Section>

          <Section title="Program Pelatihan & Motivasi">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Program" value={pendaftar.program?.nama || pendaftar.jenis_pelatihan} />
              <InfoItem label="Durasi" value={pendaftar.program?.durasi || '-'} />
            </div>
            <div className="mt-3">
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Motivasi Bergabung</div>
              <div className="text-sm text-[var(--text-primary)] bg-[var(--surface)] rounded-lg p-3 leading-relaxed">
                {pendaftar.motivasi}
              </div>
            </div>
          </Section>

          {pendaftar.status === 'diterima' && (
            <Section title="Informasi & Bukti Pembayaran">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <InfoItem label="Biaya Pelatihan" value={pendaftar.program?.harga_formatted || `Rp ${pendaftar.biaya_pelatihan || 3500000}`} />
                <InfoItem label="Status Pembayaran" value={pendaftar.status_pembayaran === 'lunas' ? 'LUNAS' : pendaftar.status_pembayaran === 'menunggu_konfirmasi' ? 'MENUNGGU VERIFIKASI ADMIN' : 'BELUM BAYAR'} />
              </div>
              {pendaftar.bukti_pembayaran && (
                <div className="bg-[var(--surface)] p-3 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-[var(--text-secondary)]">
                    Metode: {pendaftar.metode_pembayaran || 'Transfer Bank'} • Waktu: {new Date(pendaftar.tanggal_bayar || '').toLocaleString('id-ID')}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendaftar.bukti_pembayaran}
                    alt="Bukti Pembayaran"
                    className="max-h-56 rounded-lg border border-[var(--card-border)] mx-auto bg-white p-1"
                  />
                </div>
              )}
              {pendaftar.status_pembayaran !== 'lunas' && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={async () => {
                      await pembayaranApi.verifikasi(pendaftar.id);
                      onStatusChange();
                    }}
                    className="btn btn-accent btn-sm flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Konfirmasi & Tandai Lunas</span>
                  </button>
                </div>
              )}
            </Section>
          )}
        </div>

        {pendaftar.status === 'menunggu' && (
          <div className="p-6 border-t border-[var(--card-border)] flex gap-3 justify-end">
            <button onClick={handleReject} className="btn btn-danger btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <line x1="8" y1="8" x2="16" y2="16" />
              </svg>
              Tolak
            </button>
            <button onClick={handleAccept} className="btn btn-accent btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Terima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-4 rounded-full bg-[var(--primary)]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={`bg-[var(--surface)] rounded-lg p-2.5 ${span2 ? 'col-span-2' : ''}`}>
      <div className="text-[0.65rem] text-[var(--text-tertiary)] mb-0.5 uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-sm text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
