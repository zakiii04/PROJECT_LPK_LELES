import type { Pendaftar, Pembayaran } from '@/lib/types';

interface PaymentDetailModalProps {
  pendaftar: Pendaftar;
  pembayaran: Pembayaran;
  onClose: () => void;
}

export default function PaymentDetailModal({ pendaftar, pembayaran, onClose }: PaymentDetailModalProps) {
  const nominal = Number(pembayaran.nominal || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl p-6 space-y-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Detail Pembayaran</h3>
            <p className="text-xs text-slate-500">{padaftarLabel(pendaftar)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-800 text-lg font-bold" aria-label="Tutup">
            X
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <Info label="Nominal" value={`Rp ${nominal}`} />
          <Info label="Tipe Pembayaran" value={pembayaran.tipe_pembayaran === 'cash' ? 'Cash' : 'Transfer'} />
          <Info label="Status Validasi" value={pembayaran.status === 'menunggu_verifikasi' ? 'Menunggu Verifikasi' : pembayaran.status === 'diterima' ? 'Diterima' : 'Ditolak'} />
          <Info label="Tanggal Pembayaran" value={new Date(pembayaran.tanggal_bayar).toLocaleString('id-ID')} />
          {pembayaran.tipe_pembayaran === 'cash' ? (
            <Info label="Nama Penerima" value={pembayaran.nama_penerima || '-'} />
          ) : (
            <>
              <Info label="Nama Pengirim" value={pembayaran.nama_pengirim || '-'} />
                            <Info label="Asal Bank" value={pembayaran.jenis_pengirim || '-'} />
              <Info label="Metode Pembayaran" value={pembayaran.metode_pembayaran || '-'} />
            </>
          )}
        </div>

        {pembayaran.bukti_pembayaran && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Bukti Pembayaran</div>
            <img src={pembayaran.bukti_pembayaran} alt="Bukti pembayaran" className="max-h-80 max-w-full rounded-xl border border-slate-200 object-contain" />
          </div>
        )}

        {pembayaran.catatan_admin && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <span className="font-bold">Catatan Admin:</span> {pembayaran.catatan_admin}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Tutup</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-800 break-words">{value}</div>
    </div>
  );
}

function padaftarLabel(pendaftar: Pendaftar) {
  return `${pendaftar.nama_lengkap} • ${pendaftar.no_pendaftaran}`;
}
