'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import Pagination from '../../../../components/Pagination';

export default function AdminSyncLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logsData, setLogsData] = useState<any>(null);
  const [page, setPage] = useState(1);

  const fetchLogs = async (pNum: number) => {
    setLoading(true);
    const res = await fetchApi<any>(`/api/admin/sync-logs?page=${pNum}&limit=10`);
    if (res.success && res.data) {
      setLogsData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'En progreso...';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const sec = Math.floor(durationMs / 1000);
    return `${sec} segundos`;
  };

  if (loading && !logsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-black">
          Logs de Sincronización
        </h1>
        <p className="text-sm text-slate-400">
          Historial de sincronización automática de stock y precios desde GesCom local.
        </p>
      </div>

      {logsData && logsData.items.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="px-6 py-4">ID de Corrida</th>
                  <th className="px-6 py-4">Fecha de Inicio</th>
                  <th className="px-6 py-4">Duración</th>
                  <th className="px-6 py-4 text-center">Nuevos</th>
                  <th className="px-6 py-4 text-center">Actualizados</th>
                  <th className="px-6 py-4 text-center">Imágenes</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logsData.items.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 text-slate-600 transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                      {log.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{formatDate(log.startedAt)}</td>
                    <td className="px-6 py-4">{getDuration(log.startedAt, log.finishedAt)}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{log.productsCreated}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{log.productsUpdated}</td>
                    <td className="px-6 py-4 text-center text-slate-500 font-mono">
                      Sub: {log.imagesUploaded} | Om: {log.imagesSkipped}
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                          <CheckCircle className="h-3.5 w-3.5" /> Exitoso
                        </span>
                      ) : log.status === 'PARTIAL' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full uppercase">
                          <AlertTriangle className="h-3.5 w-3.5" /> Parcial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full uppercase">
                          <XCircle className="h-3.5 w-3.5" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={logsData.totalPages}
            onPageChange={setPage}
            totalItems={logsData.total}
            itemLabel="Corridas"
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 shadow-[0_5px_20px_rgba(0,0,0,0.01)]">
          <p>No se registran logs de sincronización todavía.</p>
        </div>
      )}
    </div>
  );
}
